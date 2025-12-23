'use client';

import { useState } from 'react';
import { reportsAPI } from '@/lib/api';

export default function ReportsPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportType, setReportType] = useState('sales');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateReport = async () => {
    // Stock Summary doesn't need dates
    if (reportType !== 'stock-summary' && (!startDate || !endDate)) {
      alert('Please select start and end dates');
      return;
    }

    setLoading(true);
    try {
      let response;
      switch (reportType) {
        case 'sales':
          response = await reportsAPI.getSalesReport(startDate, endDate);
          break;
        case 'profit-loss':
          response = await reportsAPI.getProfitLoss(startDate, endDate);
          break;
        case 'product-sales':
          response = await reportsAPI.getProductSales(startDate, endDate);
          break;
        case 'sales-transactions':
          response = await reportsAPI.getSalesTransactions(startDate, endDate);
          break;
        case 'purchase-transactions':
          response = await reportsAPI.getPurchaseTransactions(startDate, endDate);
          break;
        case 'bill-wise-items':
          response = await reportsAPI.getBillWiseItems(startDate, endDate);
          break;
        case 'stock-summary':
          response = await reportsAPI.getStockSummary();
          break;
        case 'pl-statement':
          response = await reportsAPI.getPLStatement(startDate, endDate);
          break;
        default:
          response = await reportsAPI.getSalesReport(startDate, endDate);
      }
      setReportData(response.data);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const renderReportData = () => {
    if (!reportData) return null;

    switch (reportType) {
      case 'sales-transactions':
        return (
          <div>
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>Summary</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>Total Transactions</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--black)' }}>{reportData.summary?.totalTransactions || 0}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>Total Sales</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--black)' }}>₹{reportData.summary?.totalSales?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>Total GST</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--black)' }}>₹{reportData.summary?.totalGST?.toFixed(2) || '0.00'}</p>
                </div>
              </div>
            </div>
            <div className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Subtotal</th>
                  <th>GST</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {reportData.transactions && reportData.transactions.length > 0 ? (
                  reportData.transactions.map((t: any, idx: number) => (
                    <tr key={idx}>
                      <td>{new Date(t.date).toLocaleDateString()}</td>
                      <td style={{ fontWeight: '500' }}>{t.invoiceNumber}</td>
                      <td>{t.customer?.name || 'Unknown'}</td>
                      <td>₹{(t.subtotal || 0).toFixed(2)}</td>
                      <td>₹{(t.totalGST || 0).toFixed(2)}</td>
                      <td style={{ fontWeight: '600' }}>₹{(t.grandTotal || 0).toFixed(2)}</td>
                      <td><span className="badge badge-primary">{t.status}</span></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: 'var(--gray-600)', padding: '2rem' }}>
                      No transactions found for the selected date range
                    </td>
                  </tr>
                )}
              </tbody>
            </div>
          </div>
        );

      case 'purchase-transactions':
        return (
          <div>
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>Summary</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>Total Purchase Days</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--black)' }}>{reportData.summary?.totalPurchases || 0}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>Total Cost</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--black)' }}>₹{reportData.summary?.totalCost?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>Total Items</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--black)' }}>{reportData.summary?.totalItems || 0}</p>
                </div>
              </div>
            </div>
            {reportData.purchases && reportData.purchases.length > 0 ? (
              reportData.purchases.map((purchase: any, idx: number) => (
              <div key={idx} className="card" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600' }}>{new Date(purchase.date).toLocaleDateString()}</h4>
                  <span style={{ fontSize: '1rem', fontWeight: '600' }}>₹{purchase.totalCost.toFixed(2)}</span>
                </div>
                <div className="table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Unit Price</th>
                      <th>Total Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchase.items.map((item: any, i: number) => (
                      <tr key={i}>
                        <td>{item.productName}</td>
                        <td>{item.quantity} {item.unit}</td>
                        <td>₹{item.purchasePrice.toFixed(2)}</td>
                        <td>₹{item.totalCost.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </div>
              </div>
              ))
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-600)' }}>
                No purchase transactions found for the selected date range
              </div>
            )}
          </div>
        );

      case 'bill-wise-items':
        return (
          <div>
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>Summary</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Total Bills: {reportData.totalBills}</p>
            </div>
            {reportData.bills && reportData.bills.length > 0 ? (
              reportData.bills.map((bill: any, idx: number) => (
                <div key={idx} className="card" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--gray-200)' }}>
                  <div>
                    <p style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem' }}>Invoice: {bill.invoiceNumber}</p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                      {new Date(bill.date).toLocaleDateString()} • {bill.customerName}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '1.25rem', fontWeight: '700' }}>₹{bill.grandTotal.toFixed(2)}</p>
                    <span className="badge badge-primary">{bill.status}</span>
                  </div>
                </div>
                <div className="table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>HSN</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th>GST %</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bill.items.map((item: any, i: number) => (
                      <tr key={i}>
                        <td>{item.productName}</td>
                        <td>{item.hsnCode || '-'}</td>
                        <td>{item.quantity} {item.unit}</td>
                        <td>₹{item.unitPrice.toFixed(2)}</td>
                        <td>{item.gstRate}%</td>
                        <td style={{ fontWeight: '500' }}>₹{item.itemTotal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </div>
              </div>
              ))
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-600)' }}>
                No bills found for the selected date range
              </div>
            )}
          </div>
        );

      case 'stock-summary':
        return (
          <div>
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>Summary</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>Total Products</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--black)' }}>{reportData.summary?.totalProducts || 0}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>Stock Value</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--black)' }}>₹{reportData.summary?.totalStockValue?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>Low Stock Items</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--black)' }}>{reportData.summary?.lowStockCount || 0}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>Out of Stock</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--black)' }}>{reportData.summary?.outOfStockCount || 0}</p>
                </div>
              </div>
            </div>
            <div className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Stock</th>
                  <th>Min Stock</th>
                  <th>Unit</th>
                  <th>Stock Value</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {reportData.stockSummary && reportData.stockSummary.length > 0 ? (
                  reportData.stockSummary.map((item: any) => (
                  <tr key={item.productId}>
                    <td style={{ fontWeight: '500' }}>{item.name}</td>
                    <td>{item.sku || '-'}</td>
                    <td>{item.category || '-'}</td>
                    <td>{item.stock}</td>
                    <td>{item.minStock}</td>
                    <td>{item.unit}</td>
                    <td>₹{item.stockValue.toFixed(2)}</td>
                    <td>
                      <span className={`badge ${item.isLowStock ? 'badge-danger' : item.stock === 0 ? 'badge-secondary' : 'badge-success'}`}>
                        {item.stockStatus}
                      </span>
                    </td>
                  </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', color: 'var(--gray-600)', padding: '2rem' }}>
                      No products found
                    </td>
                  </tr>
                )}
              </tbody>
            </div>
          </div>
        );

      case 'pl-statement':
        return (
          <div>
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>Overall Summary</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>Total Revenue</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--black)' }}>₹{reportData.summary?.totalRevenue?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>Total Cost</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--black)' }}>₹{reportData.summary?.totalCost?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>Total Profit</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--black)' }}>₹{reportData.summary?.totalProfit?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>Profit Margin</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--black)' }}>{reportData.summary?.overallProfitMargin?.toFixed(2) || '0.00'}%</p>
                </div>
              </div>
            </div>
            <div className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Qty Sold</th>
                  <th>Revenue</th>
                  <th>Cost</th>
                  <th>Profit</th>
                  <th>Margin %</th>
                </tr>
              </thead>
              <tbody>
                {reportData.plStatement && reportData.plStatement.length > 0 ? (
                  reportData.plStatement.map((item: any) => (
                  <tr key={item.productId}>
                    <td style={{ fontWeight: '500' }}>{item.productName}</td>
                    <td>{item.sku || '-'}</td>
                    <td>{item.category || '-'}</td>
                    <td>{item.totalQuantitySold}</td>
                    <td>₹{item.totalRevenue.toFixed(2)}</td>
                    <td>₹{item.totalCost.toFixed(2)}</td>
                    <td style={{ fontWeight: '600', color: item.totalProfit >= 0 ? 'var(--black)' : 'var(--danger)' }}>
                      ₹{item.totalProfit.toFixed(2)}
                    </td>
                    <td>{item.profitMargin.toFixed(2)}%</td>
                  </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', color: 'var(--gray-600)', padding: '2rem' }}>
                      No P&L data found for the selected date range
                    </td>
                  </tr>
                )}
              </tbody>
            </div>
          </div>
        );

      case 'sales':
        return (
          <div>
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>Summary</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>Total Sales</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--black)' }}>₹{reportData.totalSales?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>Total GST</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--black)' }}>₹{reportData.totalGST?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>Invoice Count</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--black)' }}>{reportData.invoiceCount || 0}</p>
                </div>
              </div>
            </div>
            {reportData.dailySales && reportData.dailySales.length > 0 && (
              <div className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Sales</th>
                    <th>Invoice Count</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.dailySales.map((day: any, idx: number) => (
                    <tr key={idx}>
                      <td>{new Date(day.date).toLocaleDateString()}</td>
                      <td style={{ fontWeight: '600' }}>₹{day.sales.toFixed(2)}</td>
                      <td>{day.count}</td>
                    </tr>
                  ))}
                </tbody>
              </div>
            )}
          </div>
        );

      case 'profit-loss':
        return (
          <div>
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>Profit & Loss Summary</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>Revenue</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--black)' }}>₹{reportData.revenue?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>Costs</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--black)' }}>₹{reportData.costs?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>Profit</p>
                  <p style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: '700', 
                    color: (reportData.profit || 0) >= 0 ? 'var(--black)' : 'var(--danger)' 
                  }}>
                    ₹{reportData.profit?.toFixed(2) || '0.00'}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>Profit Margin</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--black)' }}>
                    {reportData.profitMargin?.toFixed(2) || '0.00'}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'product-sales':
        return (
          <div>
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>Summary</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                Total Products: {reportData.products?.length || 0}
              </p>
            </div>
            {reportData.products && reportData.products.length > 0 && (
              <div className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity Sold</th>
                    <th>Total Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.products.map((product: any) => (
                    <tr key={product.productId}>
                      <td style={{ fontWeight: '500' }}>{product.productName}</td>
                      <td>{product.quantity}</td>
                      <td style={{ fontWeight: '600' }}>₹{product.totalSales.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div style={{
            background: 'var(--gray-50)',
            padding: '1.5rem',
            borderRadius: 'var(--radius)',
            overflow: 'auto',
            maxHeight: '600px'
          }}>
            <p style={{ marginBottom: '1rem', color: 'var(--gray-600)' }}>
              Report data format not recognized. Raw data:
            </p>
            <pre style={{
              margin: 0,
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              lineHeight: '1.6',
              color: 'var(--gray-700)'
            }}>
              {JSON.stringify(reportData, null, 2)}
            </pre>
          </div>
        );
    }
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--black)', marginBottom: '0.5rem' }}>
          Reports
        </h1>
        <p style={{ color: 'var(--gray-600)' }}>Generate detailed business reports and analytics</p>
      </div>
      
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>Report Configuration</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="form-input"
            >
              <optgroup label="Transaction Reports">
                <option value="sales-transactions">Sales Transactions</option>
                <option value="purchase-transactions">Purchase Transactions</option>
              </optgroup>
              <optgroup label="Bill-wise Reports">
                <option value="bill-wise-items">Item-level Sales Analysis</option>
              </optgroup>
              <optgroup label="Item Reports">
                <option value="stock-summary">Stock Summary</option>
                <option value="pl-statement">P&L Statement</option>
              </optgroup>
              <optgroup label="Other Reports">
                <option value="sales">Sales Report</option>
                <option value="profit-loss">Profit & Loss</option>
                <option value="product-sales">Product Sales</option>
              </optgroup>
            </select>
          </div>
          {reportType !== 'stock-summary' && (
            <>
              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="form-input"
                />
              </div>
            </>
          )}
          <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              onClick={handleGenerateReport}
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>

      {reportData && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Report Results</h2>
            <button
              onClick={() => window.print()}
              className="btn btn-secondary"
              style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
            >
              🖨️ Print
            </button>
          </div>
          {renderReportData()}
        </div>
      )}
    </div>
  );
}
