import React from 'react';
import './Dashboard.css';

const Dashboard = () => {
  return (
    <div className="dashboard">
      {/* Header Navigation */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1 className="logo">Baby Growth Monitor</h1>
          <nav className="nav-menu">
            <a href="#dashboard" className="nav-link active">Dashboard</a>
            <a href="#add-baby" className="nav-link">Add Baby</a>
            <a href="#add-growth" className="nav-link">Add Growth</a>
            <a href="#charts" className="nav-link">Charts</a>
            <a href="#alerts" className="nav-link">Alerts</a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-container">
          {/* Title Section */}
          <div className="title-section">
            <h2 className="dashboard-title">Baby Growth Monitoring Dashboard</h2>
            <p className="dashboard-subtitle">Track and monitor your baby's growth with comprehensive tools and insights</p>
          </div>

          {/* Action Cards */}
          <div className="action-cards">
            <div className="card add-baby-card">
              <div className="card-icon">👶</div>
              <h3 className="card-title">Add Baby</h3>
              <p className="card-description">Create new baby profile</p>
            </div>

            <div className="card add-growth-card">
              <div className="card-icon">📏</div>
              <h3 className="card-title">Add Growth</h3>
              <p className="card-description">Record growth measurements</p>
            </div>

            <div className="card view-charts-card">
              <div className="card-icon">📊</div>
              <h3 className="card-title">View Charts</h3>
              <p className="card-description">Analyze growth patterns</p>
            </div>

            <div className="card alerts-card">
              <div className="card-icon">🚨</div>
              <h3 className="card-title">Alerts</h3>
              <p className="card-description">Check growth alerts</p>
            </div>
          </div>

          {/* System Features */}
          <div className="system-features">
            <h3 className="section-title">System Features</h3>
            <div className="features-grid">
              <div className="feature-item">
                <div className="feature-icon">👤</div>
                <div className="feature-content">
                  <h4>Baby Profile Management</h4>
                  <p>Create and manage baby profiles with name, gender, and birth date</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">📈</div>
                <div className="feature-content">
                  <h4>Interactive Charts</h4>
                  <p>Visualize growth patterns with responsive charts and statistics</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">📏</div>
                <div className="feature-content">
                  <h4>Growth Tracking</h4>
                  <p>Record weight, height measurements with automatic Z-score calculations</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">⚠️</div>
                <div className="feature-content">
                  <h4>Smart Alerts</h4>
                  <p>Get notified about unusual growth patterns and anomalies</p>
                </div>
              </div>
            </div>
          </div>

          {/* API Integration */}
          <div className="api-integration">
            <h3 className="section-title">API Integration</h3>
            <div className="api-content">
              <div className="api-endpoints">
                <h4>Endpoints Used</h4>
                <ul>
                  <li><strong>POST</strong> /api/baby/ - Create baby profile</li>
                  <li><strong>POST</strong> /api/growth/ - Submit growth data</li>
                  <li><strong>GET</strong> /api/growth/&lt;baby_id&gt;/ - Fetch growth history</li>
                  <li><strong>GET</strong> /api/alerts/&lt;baby_id&gt;/ - Get growth alerts</li>
                </ul>
              </div>
              <div className="api-features">
                <h4>Features</h4>
                <ul>
                  <li>Z-score calculations for weight and height</li>
                  <li>Growth classification (Normal, Underweight, etc.)</li>
                  <li>Anomaly detection and flagging</li>
                  <li>Historical data visualization</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
