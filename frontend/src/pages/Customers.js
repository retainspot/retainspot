import React, { useMemo, useState } from 'react';

const Customers = ({ customers = [] }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 50;

  // Helper function to check if value is truthy (handles multiple formats)
  const isTrue = (val) => {
    if (val === undefined || val === null) return false;
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') return val.toLowerCase() === 'true' || val === '1';
    if (typeof val === 'number') return val === 1;
    return false;
  };

  // Calculate stats from the actual data
  const stats = useMemo(() => {
    const totalCustomers = customers.length;
    const churnedCustomers = customers.filter(c => isTrue(c.Churn)).length;
    const activeCustomers = totalCustomers - churnedCustomers;
    const seniorCitizens = customers.filter(c => isTrue(c.SeniorCitizen)).length;
    const hasPartner = customers.filter(c => isTrue(c.Partner)).length;
    
    return {
      total: totalCustomers,
      active: activeCustomers,
      churned: churnedCustomers,
      churnRate: totalCustomers > 0 ? ((churnedCustomers / totalCustomers) * 100).toFixed(1) : 0,
      seniorCitizens,
      hasPartner
    };
  }, [customers]);

  // Calculate pagination
  const totalPages = Math.ceil(customers.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentCustomers = customers.slice(startIndex, endIndex);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 6) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const handlePageChange = (page) => {
    if (typeof page === 'number' && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="customers-page">
      {/* STATS CARDS */}
      <div className="customers-stats-row">
        {[
          { 
            label: 'Total Customers', 
            val: stats.total.toLocaleString(), 
            color: '#00AC4F', 
            trend: `${stats.active} Active`, 
            icon: '👥', 
            iconBg: '#D3FFE7' 
          },
          { 
            label: 'Churned', 
            val: stats.churned.toLocaleString(), 
            color: '#D0004B', 
            trend: `${stats.churnRate}% Rate`, 
            icon: '❌', 
            iconBg: '#FFE2E5' 
          },
          { 
            label: 'Senior Citizens', 
            val: stats.seniorCitizens.toLocaleString(), 
            color: null, 
            icon: '👴', 
            iconBg: '#F3E8FF' 
          }
        ].map((item, idx) => (
          <div key={idx} className="customer-stat-card">
            <div className="stat-circle-icon" style={{ backgroundColor: item.iconBg }}>{item.icon}</div>
            <div className="stat-text-content">
              <p className="stat-label-gray">{item.label}</p>
              <h2 className="stat-value-large">{item.val}</h2>
              {item.trend && (
                <span className="stat-trend-small" style={{ color: item.color || '#292D32' }}>
                  {item.trend}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* TABLE SECTION */}
      <div className="customers-table-container">
        <div className="table-header-flex">
          <div>
            <h2 className="table-main-title">All Customers</h2>
            <p className="table-sub-title">Telco Customer Data</p>
          </div>
          <div className="table-actions">
            <div className="table-search-box">
              <span className="search-icon-small">🔍</span>
              <input type="text" placeholder="Search" className="search-input-small" />
            </div>
            <div className="sort-box">
              Sort by : <span className="sort-bold">Tenure ⌵</span>
            </div>
          </div>
        </div>

        <table className="main-customers-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Gender</th>
              <th>Senior</th>
              <th>Partner</th>
              <th>Dependents</th>
              <th>Tenure</th>
              <th>Phone</th>
              <th>Internet</th>
              <th>Contract</th>
              <th style={{ textAlign: 'center' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {currentCustomers.map((c, i) => {
              // Determine contract type
              let contractType = 'Month-to-month';
              if (isTrue(c['Contract_One year'])) contractType = 'One year';
              if (isTrue(c['Contract_Two year'])) contractType = 'Two year';
              
              // Determine internet service type
              let internetType = 'DSL';
              if (isTrue(c['InternetService_Fiber optic'])) {
                internetType = 'Fiber optic';
              } else if (isTrue(c.InternetService_No)) {
                internetType = 'No';
              }

              return (
                <tr key={startIndex + i}>
                  <td className="bold-cell">#{startIndex + i + 1}</td>
                  <td>{isTrue(c.gender) ? 'Male' : 'Female'}</td>
                  <td>{isTrue(c.SeniorCitizen) ? 'Yes' : 'No'}</td>
                  <td>{isTrue(c.Partner) ? 'Yes' : 'No'}</td>
                  <td>{isTrue(c.Dependents) ? 'Yes' : 'No'}</td>
                  <td>{c.tenure !== undefined && c.tenure !== null && c.tenure !== '' ? parseFloat(c.tenure).toFixed(2) : 'N/A'}</td>
                  <td>{isTrue(c.PhoneService) ? 'Yes' : 'No'}</td>
                  <td>{internetType}</td>
                  <td>{contractType}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`status-badge ${isTrue(c.Churn) ? 'churned' : 'active'}`}>
                      {isTrue(c.Churn) ? 'Churned' : 'Active'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* PAGINATION */}
        <div className="pagination-footer">
          <span>
            Showing data {startIndex + 1} to {Math.min(endIndex, customers.length)} of {customers.length.toLocaleString()} entries
          </span>
          <div className="pagination-controls">
            <button 
              className="page-nav-btn" 
              onClick={handlePrevious}
              disabled={currentPage === 1}
            >
              &lt;
            </button>
            {getPageNumbers().map((p, i) => (
              <span 
                key={i} 
                className={`page-number ${p === currentPage ? 'active' : ''} ${typeof p !== 'number' ? 'ellipsis' : ''}`}
                onClick={() => typeof p === 'number' && handlePageChange(p)}
                style={{ cursor: typeof p === 'number' ? 'pointer' : 'default' }}
              >
                {p}
              </span>
            ))}
            <button 
              className="page-nav-btn" 
              onClick={handleNext}
              disabled={currentPage === totalPages}
            >
              &gt;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Customers;