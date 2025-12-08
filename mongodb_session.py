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
        sid = request.cookies.get(app.session_cookie_name)
        if not sid:
            sid = self._generate_sid()
            return MongoDBSession(sid=sid, permanent=self.permanent)
        
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
                return MongoDBSession(data, sid=sid, permanent=self.permanent)
            else:
                # Session expired or not found
                return MongoDBSession(sid=sid, permanent=self.permanent)
        except Exception as e:
            print(f"Error loading session from MongoDB: {e}")
            return MongoDBSession(sid=sid, permanent=self.permanent)
    
    def save_session(self, app, session, response):
        """Save session to MongoDB"""
        domain = self.get_cookie_domain(app)
        path = self.get_cookie_path(app)
        
        # If session is empty or should be deleted, remove it
        if not session or (hasattr(session, 'sid') and not session):
            sid = getattr(session, 'sid', None)
            if sid:
                try:
                    self.db[self.collection].delete_one({'_id': sid})
                except Exception as e:
                    print(f"Error deleting session: {e}")
            response.delete_cookie(
                app.session_cookie_name,
                domain=domain,
                path=path
            )
            return
        
        # Calculate expiration
        if self.permanent:
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
            
            # Set cookie with session ID
            response.set_cookie(
                app.session_cookie_name,
                sid,
                expires=expires,
                httponly=self.get_cookie_httponly(app),
                domain=domain,
                path=path,
                secure=self.get_cookie_secure(app),
                samesite=self.get_cookie_samesite(app)
            )
        except Exception as e:
            print(f"Error saving session to MongoDB: {e}")
            import traceback
            traceback.print_exc()
    
    def _generate_sid(self):
        """Generate a unique session ID"""
        return str(uuid.uuid4())

