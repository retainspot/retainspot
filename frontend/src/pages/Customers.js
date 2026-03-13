import React, { useMemo, useState, useEffect } from 'react';
import '../App.css';

const Customers = ({ customers: initialCustomers = [] }) => {
  const [customersData, setCustomersData] = useState(initialCustomers);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const rowsPerPage = 50;

  useEffect(() => {
    setCustomersData(initialCustomers);
  }, [initialCustomers]);

  const closeModal = () => setSelectedCustomer(null);

  const isTrue = (val) => {
    if (val === undefined || val === null) return false;
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') return val.toLowerCase() === 'true' || val === '1';
    if (typeof val === 'number') return val === 1;
    return false;
  };

  const filteredCustomers = useMemo(() => {
    return customersData.filter(c =>
      c.customerID.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customersData, searchTerm]);

  const stats = useMemo(() => {
    const totalCustomers = customersData.length;
    const churnedCustomers = customersData.filter(c => isTrue(c.Churn)).length;
    const activeCustomers = totalCustomers - churnedCustomers;
    const seniorCitizens = customersData.filter(c => isTrue(c.SeniorCitizen)).length;

    return {
      total: totalCustomers,
      active: activeCustomers,
      churned: churnedCustomers,
      churnRate: totalCustomers > 0 ? ((churnedCustomers / totalCustomers) * 100).toFixed(1) : 0,
      seniorCitizens
    };
  }, [customersData]);

  const totalPages = Math.ceil(filteredCustomers.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentCustomers = filteredCustomers.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    if (typeof page === 'number' && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePrevious = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const handleNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 6) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) pages.push(1, 2, 3, 4, '...', totalPages);
      else if (currentPage >= totalPages - 2) pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      else pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }
    return pages;
  };

  const handleSaveFeedback = async (customerId, feedback) => {
    try {
      const response = await fetch(`http://localhost:8000/api/customers/${customerId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback }),
      });

      if (response.ok) {
        const updatedList = customersData.map((c) =>
          c.customerID === customerId ? { ...c, CustomerFeedback: feedback } : c
        );
        setCustomersData(updatedList);

        alert('Feedback saved successfully!');
        closeModal();
      } else {
        alert('Failed to save feedback.');
      }
    } catch (error) {
      console.error('Error saving feedback:', error);
      alert('Server error!');
    }
  };

  return (
    <div className="customers-page">
      <div className="customers-stats-row">
        {[
          { label: 'Total Customers', val: stats.total.toLocaleString(), color: '#00AC4F', trend: `${stats.active.toLocaleString()} Active`, icon: '👥', iconBg: '#D3FFE7' },
          { label: 'Churned', val: stats.churned.toLocaleString(), color: '#D0004B', trend: `${stats.churnRate}% Rate`, icon: '❌', iconBg: '#FFE2E5' },
          { label: 'Senior Citizens', val: stats.seniorCitizens.toLocaleString(), icon: '👴', iconBg: '#F3E8FF' }
        ].map((item, idx) => (
          <div key={idx} className="customer-stat-card">
            <div className="stat-circle-icon" style={{ backgroundColor: item.iconBg }}>{item.icon}</div>
            <div className="stat-text-content">
              <p className="stat-label-gray">{item.label}</p>
              <h2 className="stat-value-large">{item.val}</h2>
              {item.trend && <span className="stat-trend-small" style={{ color: item.color || '#292D32' }}>{item.trend}</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="customers-table-container">
        <div className="table-header-flex">
          <div>
            <h2 className="table-main-title">All Customers</h2>
            <p className="table-sub-title">Telco Customer Data</p>
          </div>
          <div className="table-actions">
            <div className="table-search-box">
              <span className="search-icon-small">🔍</span>
              <input
                type="text"
                placeholder="Search by ID..."
                className="search-input-small"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
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
              let contractType = isTrue(c['Contract_One year']) ? 'One year' : isTrue(c['Contract_Two year']) ? 'Two year' : 'Month-to-month';
              let internetType = isTrue(c['InternetService_Fiber optic']) ? 'Fiber optic' : isTrue(c.InternetService_No) ? 'No' : 'DSL';

              return (
                <tr key={c.customerID}>
                  <td className="bold-cell">
                    <button className="id-link-btn" onClick={() => setSelectedCustomer(c)}>
                      {c.customerID}
                    </button>
                  </td>
                  <td>{isTrue(c.gender) ? 'Male' : 'Female'}</td>
                  <td>{isTrue(c.SeniorCitizen) ? 'Yes' : 'No'}</td>
                  <td>{isTrue(c.Partner) ? 'Yes' : 'No'}</td>
                  <td>{isTrue(c.Dependents) ? 'Yes' : 'No'}</td>
                  <td>{c.tenure ? parseFloat(c.tenure).toFixed(2) : 'N/A'}</td>
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

        {selectedCustomer && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Admin Feedback</h2>
                <button className="close-btn" onClick={closeModal}>&times;</button>
              </div>
              <div className="modal-body">
                <p><strong>Customer ID:</strong> #{selectedCustomer.customerID}</p>
                <div className="feedback-section">
                  <label>Feedback:</label>
                  <textarea
                    id="feedback"
                    className="feedback-textarea"
                    placeholder="Enter notes..."
                    defaultValue={selectedCustomer.CustomerFeedback || ''}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button className="cancel-btn" onClick={closeModal}>Cancel</button>
                <button className="save-btn" onClick={() => handleSaveFeedback(selectedCustomer.customerID, document.getElementById('feedback').value)}>
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="pagination-footer">
          <span>
            Showing {startIndex + 1} to {Math.min(endIndex, filteredCustomers.length)} of {filteredCustomers.length} entries
          </span>
          <div className="pagination-controls">
            <button className="page-nav-btn" onClick={handlePrevious} disabled={currentPage === 1}>&lt;</button>
            {getPageNumbers().map((p, i) => (
              <span key={i} className={`page-number ${p === currentPage ? 'active' : ''} ${typeof p !== 'number' ? 'ellipsis' : ''}`} onClick={() => typeof p === 'number' && handlePageChange(p)}>
                {p}
              </span>
            ))}
            <button className="page-nav-btn" onClick={handleNext} disabled={currentPage === totalPages}>&gt;</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Customers;