"""
Custom MongoDB session interface for Flask-Session
Stores sessions in MongoDB instead of cookies to avoid cross-origin issues
"""
from flask.sessions import SessionInterface, SessionMixin
from werkzeug.datastructures import CallbackDict
from pymongo.errors import PyMongoError
from bson import ObjectId
from datetime import timedelta
import pickle
import uuid
from datetime import datetime, timezone


class MongoDBSession(CallbackDict, SessionMixin):
    """MongoDB-backed session"""
    def __init__(self, initial=None, sid=None, permanent=None):
        def on_update(self):
            self.modified = True
        CallbackDict.__init__(self, initial, on_update)
        self.sid = sid
        self.permanent = permanent if permanent is not None else True
        self.modified = False


class MongoDBSessionInterface(SessionInterface):
    """Session interface that stores sessions in MongoDB"""
    
    def __init__(self, db, collection='sessions', key_prefix='session:'):
        self.db = db
        self.collection = collection
        self.key_prefix = key_prefix
        # Create TTL index for automatic session cleanup (7 days)
        try:
            db[collection].create_index('expires', expireAfterSeconds=0)
        except Exception as e:
            print(f"Note: Could not create TTL index on sessions collection: {e}")
    
    def open_session(self, app, request):
        """Load session from MongoDB"""
        cookie_name = app.config.get('SESSION_COOKIE_NAME', 'session_id')
        sid = request.cookies.get(cookie_name)
        if not sid:
            sid = self._generate_sid()
            return MongoDBSession(sid=sid, permanent=True)
        
        # Remove key prefix if present
        if sid.startswith(self.key_prefix):
            sid = sid[len(self.key_prefix):]
        
        try:
            # Find session in MongoDB
            session_doc = self.db[self.collection].find_one({
                '_id': sid,
                'expires': {'$gt': datetime.now(timezone.utc)}
            })
            
            if session_doc:
                # Unpickle session data
                data = pickle.loads(session_doc['data'])
                return MongoDBSession(data, sid=sid, permanent=True)
            else:
                # Session expired or not found
                return MongoDBSession(sid=sid, permanent=True)
        except Exception as e:
            print(f"Error loading session from MongoDB: {e}")
            return MongoDBSession(sid=sid, permanent=self.permanent)
    
    def save_session(self, app, session, response):
        """Save session to MongoDB"""
        domain = self.get_cookie_domain(app)
        path = self.get_cookie_path(app)
        cookie_name = app.config.get('SESSION_COOKIE_NAME', 'session_id')
        
        # Check if session should be deleted (empty session dict, not just missing sid)
        # CRITICAL: Check if session dict is empty, not if session object is falsy
        session_dict = dict(session) if session else {}
        is_empty = len(session_dict) == 0
        
        # If session is empty and we have a sid, delete it
        if is_empty:
            sid = getattr(session, 'sid', None)
            if sid:
                try:
                    self.db[self.collection].delete_one({'_id': sid})
                    print(f"[SESSION] Deleted empty session: {sid}")
                except Exception as e:
                    print(f"Error deleting session: {e}")
            response.delete_cookie(
                cookie_name,
                domain=domain,
                path=path,
                secure=True,
                samesite=None
            )
            print(f"[SESSION] Deleted cookie for empty session")
            return
        
        # Calculate expiration
        if getattr(session, 'permanent', True):
            expires = datetime.now(timezone.utc) + app.permanent_session_lifetime
        else:
            expires = datetime.now(timezone.utc) + timedelta(days=1)
        
        # Prepare session data
        sid = session.sid or self._generate_sid()
        session.sid = sid
        
        # Pickle session data
        try:
            data = pickle.dumps(dict(session))
            
            # Save to MongoDB
            self.db[self.collection].update_one(
                {'_id': sid},
                {
                    '$set': {
                        'data': data,
                        'expires': expires,
                        'updated_at': datetime.now(timezone.utc)
                    }
                },
                upsert=True
            )
            
            # CRITICAL: Get SameSite value and ensure it's correct for cross-origin
            samesite = self.get_cookie_samesite(app)
            # Flask's get_cookie_samesite returns None, 'Lax', 'Strict', or 'None' as string
            # For cross-origin cookies, we need 'None' (string) which Flask converts to None
            if samesite is None:
                # Check config directly - if it's set to 'None' string, use None
                config_samesite = app.config.get('SESSION_COOKIE_SAMESITE')
                if config_samesite == 'None' or config_samesite is None:
                    samesite = None  # Flask will convert this to 'None' in Set-Cookie header
                else:
                    samesite = config_samesite
            
            # Set cookie with session ID - CRITICAL for cross-origin
            # Convert expires datetime to timestamp for cookie
            from datetime import datetime
            expires_timestamp = expires
            
            response.set_cookie(
                cookie_name,
                sid,
                expires=expires_timestamp,
                httponly=True,  # Always HttpOnly for security
                domain=domain,  # None for cross-origin
                path=path,  # '/' for root path
                secure=True,  # MUST be True for cross-origin cookies (HTTPS required)
                samesite=None  # Python None = SameSite=None for cross-origin
            )
            
            # Log cookie being set for debugging
            print(f"[SESSION] Setting cookie: name={cookie_name}, value={sid[:20]}..., secure=True, samesite=None, domain={domain}, path={path}, expires={expires}")
            print(f"[SESSION] Cookie header will be: {cookie_name}={sid}; Secure; SameSite=None; HttpOnly; Path={path}")
        except Exception as e:
            print(f"Error saving session to MongoDB: {e}")
            import traceback
            traceback.print_exc()
    
    def _generate_sid(self):
        """Generate a unique session ID"""
        return str(uuid.uuid4())

