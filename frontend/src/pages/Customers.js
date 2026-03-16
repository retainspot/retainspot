import React, { useMemo, useState, useEffect } from 'react';
import '../App.css';

const Customers = ({ customers: initialCustomers = [] }) => {
  const [customersData, setCustomersData] = useState(initialCustomers);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
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
    let result = customersData.filter(c => {
      const id = c.CustomerID || ""; // Dùng C hoa
      return id.toLowerCase().includes(searchTerm.toLowerCase());
    });

    result.sort((a, b) => {
      const scoreA = parseFloat(a.Churn_Score || 0);
      const scoreB = parseFloat(b.Churn_Score || 0);
      return sortOrder === 'desc' ? scoreB - scoreA : scoreA - scoreB;
    });

    return result;
  }, [customersData, searchTerm, sortOrder]);

  const stats = useMemo(() => {
    const totalCustomers = customersData.length;
    const highRiskCustomers = customersData.filter(c => parseFloat(c.Churn_Score || 0) > 75).length;

    return {
      total: totalCustomers,
      active: totalCustomers - highRiskCustomers,
      churned: highRiskCustomers,
      churnRate: totalCustomers > 0 ? ((highRiskCustomers / totalCustomers) * 100).toFixed(1) : 0,
      seniorCitizens: customersData.filter(c =>
        c.Senior_Citizen === "Yes" || isTrue(c.Senior_Citizen)
      ).length
    };
  }, [customersData]);

  const totalPages = Math.ceil(filteredCustomers.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentCustomers = filteredCustomers.slice(startIndex, endIndex);

  const getRiskStatus = (score) => {
    const s = parseFloat(score || 0);
    if (s > 75) return { label: 'High', class: 'churned' };
    if (s >= 50) return { label: 'Medium', class: 'pending' };
    return { label: 'Low', class: 'active' };
  };

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

      const data = await response.json();
      console.log("Dữ liệu từ API trả về:", data); // Hãy mở F12 để xem dòng này

      if (response.ok) {
        const newLabel = data.sentiment ? data.sentiment.label : "N/A";

        const updatedList = customersData.map((c) =>
          c.CustomerID === customerId
            ? {
              ...c,
              CustomerFeedback: feedback,
              sentiment_label_roberta: newLabel 
            }
            : c
        );
        setCustomersData(updatedList);

        alert(`Saved! AI Sentiment: ${newLabel}`);
        closeModal();
      } else {
        alert('Failed to save feedback.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Server error!');
    }
  };

  return (
    <div className="customers-page">
      <div className="customers-stats-row">
        {[
          { label: 'Total Customers', val: stats.total.toLocaleString(), color: '#00AC4F', trend: `${stats.active.toLocaleString()} Stable`, icon: '👥', iconBg: '#D3FFE7' },
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
              <th
                style={{ textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              >
                Status {sortOrder === 'desc' ? '▼' : '▲'}
              </th>
            </tr>
          </thead>
          <tbody>
            {currentCustomers.map((c) => {
              let contractType = isTrue(c.Contract) ? c.Contract : 'Month-to-month';
              let internetType = c.InternetService || 'DSL';

              return (
                <tr key={c.CustomerID}>
                  <td className="bold-cell">
                    <button className="id-link-btn" onClick={() => setSelectedCustomer(c)}>
                      {c.CustomerID}
                    </button>
                  </td>
                  <td>{c.Gender || 'N/A'}</td>
                  <td>{isTrue(c.Senior_Citizen) ? 'Yes' : 'No'}</td>
                  <td>{isTrue(c.Partner) ? 'Yes' : 'No'}</td>
                  <td>{isTrue(c.Dependents) ? 'Yes' : 'No'}</td>
                  <td>{c.Tenure_Months !== "" ? parseFloat(c.Tenure_Months).toFixed(0) : 'N/A'}</td>
                  <td>{isTrue(c.Phone_Service) ? 'Yes' : 'No'}</td>
                  <td>{c.Internet_Service || 'DSL'}</td>
                  <td>{c.Contract || 'Month-to-month'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`status-badge ${getRiskStatus(c.Churn_Score).class}`}>
                      {getRiskStatus(c.Churn_Score).label}
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
                <p><strong>Customer ID:</strong> #{selectedCustomer.CustomerID}</p>
                <div className="feedback-section">
                  <label htmlFor="feedback">Write your feedback:</label>
                  <textarea
                    key={selectedCustomer.CustomerID} // Buộc textarea re-render khi đổi khách hàng
                    id="feedback"
                    className="feedback-textarea"
                    placeholder="Enter notes..."
                    defaultValue={selectedCustomer.CustomerFeedback || selectedCustomer.customerfeedback || ''}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button className="cancel-btn" onClick={closeModal}>Cancel</button>
                <button
                  className="save-btn"
                  onClick={() => {
                    const fbValue = document.getElementById('feedback').value;
                    handleSaveFeedback(selectedCustomer.CustomerID, fbValue);
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="pagination-footer">
          <span>
            Showing {startIndex + 1} to {Math.min(endIndex, filteredCustomers.length)} of {filteredCustomers.length.toLocaleString()} entries
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