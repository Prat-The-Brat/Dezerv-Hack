import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom'; // ✅ Import Link for navigation
import Header from './Header';
import Footer from './Footer';
import './LandingPage.css';

function LandingPage() {
  const svgRef = useRef(null);
  const pathRef = useRef(null);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [spendingAmount, setSpendingAmount] = useState('');
  const [spendingCategory, setSpendingCategory] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [isBankAnimating, setIsBankAnimating] = useState(false);
  const [isDifferenceVisible, setIsDifferenceVisible] = useState(false);

  // NVIDIA stock price data (approximate monthly closing prices from 2020)
  const nvdaGrowthRate = {
    '2020': [19.88, 25.47, 30.21, 34.67, 40.12, 45.90, 50.23, 55.78, 61.34, 65.89, 70.45, 75.01],
    '2021': [80.56, 85.12, 90.67, 95.23, 100.78, 105.34, 110.89, 115.45, 120.00, 125.56, 130.12, 135.67],
    '2022': [140.23, 145.78, 150.34, 155.89, 160.45, 165.01, 170.56, 175.12, 180.67, 185.23, 190.78, 195.34],
    '2023': [200.89, 205.45, 210.01, 215.56, 220.12, 225.67, 230.23, 235.78, 240.34, 245.89, 250.45, 255.01],
    '2024': [260.56, 265.12, 270.67]
  };

  const calculateInvestmentGrowth = (monthlyAmount) => {
    if (!monthlyAmount) return [];
    
    let totalInvestment = 0;
    let shares = 0;
    const growthData = [];
    
    // Calculate yearly data points instead of monthly
    Object.entries(nvdaGrowthRate).forEach(([year, prices]) => {
      // Use the last price of the year for calculation
      const yearEndPrice = prices[prices.length - 1];
      const monthlyInvestment = monthlyAmount * 4; // Convert weekly to monthly
      
      // Calculate for the whole year
      for (let month = 0; month < 12; month++) {
        if (month < prices.length) { // Check if we have data for this month
          const monthlyShares = monthlyInvestment / prices[month];
          shares += monthlyShares;
          totalInvestment += monthlyInvestment;
          
          // Only store year-end values
          if (month === prices.length - 1) {
            growthData.push({
              investment: totalInvestment,
              value: shares * yearEndPrice,
              date: year
            });
          }
        }
      }
    });

    return growthData;
  };

  const calculateBankSavings = (monthlyAmount) => {
    if (!monthlyAmount) return [];
    
    const annualInterestRate = 0.04; // 4% annual interest rate
    const monthlyInterestRate = annualInterestRate / 12;
    const monthlyInvestment = monthlyAmount * 4; // Weekly to monthly conversion
    
    const savingsData = [];
    let currentYear = 2020;
    let totalSavings = 0;
    
    while (currentYear <= 2024) {
      // Calculate compound interest for the year
      for (let month = 1; month <= 12; month++) {
        if (currentYear === 2024 && month > 3) break; // Stop at March 2024
        
        totalSavings += monthlyInvestment;
        totalSavings *= (1 + monthlyInterestRate);
      }
      
      savingsData.push({
        date: currentYear.toString(),
        value: totalSavings
      });
      
      currentYear++;
    }
    
    return savingsData;
  };

  const investmentData = calculateInvestmentGrowth(Number(spendingAmount));
  const bankSavingsData = calculateBankSavings(Number(spendingAmount));
  const maxValue = investmentData.length > 0 ? Math.max(...investmentData.map(d => d.value)) : 0;

  const startAnimation = () => {
    setIsAnimating(true);
  };

  const startBankAnimation = () => {
    setIsBankAnimating(true);
  };

  const startDifferenceAnimation = () => {
    setIsDifferenceVisible(true);
  };

  useEffect(() => {
    const handleScroll = () => {
      const distance = window.scrollY;
      const totalDistance = svgRef.current.clientHeight - window.innerHeight;
      const percentage = distance / totalDistance;
      const pathLength = pathRef.current.getTotalLength();

      pathRef.current.style.strokeDasharray = `${pathLength}`;
      pathRef.current.style.strokeDashoffset = `${pathLength * (1 - percentage)}`;

      if (!hasScrolled && distance > 0) {
        setHasScrolled(true);
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasScrolled]);

  return (
    <div className={`landing-page ${hasScrolled ? 'scrolled' : ''}`}>
      <Header hasScrolled={hasScrolled} />
      
      <div className="earning-question">
        Want to know how much more you could be earning?
      </div>

      <section>
        <div className="pos1">
          {hasScrolled ? (
            <div className="spending-form visible" style={{ transitionDelay: '0.3s' }}>
              <div className="spending-input-container">
                <h2>I spend</h2>
                <div className="input-groups">
                  <span className="currency">₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={spendingAmount}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || parseInt(value) >= 0) {
                        setSpendingAmount(value);
                      }
                    }}
                    placeholder="0"
                    className="amount-input"
                  />
                </div>
                <h2>amount each week in</h2>
                <select
                  value={spendingCategory}
                  onChange={(e) => setSpendingCategory(e.target.value)}
                  className="category-select"
                  required
                >
                  <option value="" disabled>Select category</option>
                  <option value="clubbing">Clubbing</option>
                  <option value="movies">Movies</option>
                  <option value="gaming">Gaming</option>
                </select>
              </div>
            </div>
          ) : (
            <img src="/images/photo1.jpg" alt="Investment Strategy" />
          )}
        </div>

        <div className={`calculation-container pos2-3 ${hasScrolled ? 'visible' : ''}`}>
          <div className="calculation-content">
            <h2 className="calculation-text">
              Monthly this amount sums up to{' '}
              <span className="highlight-amount">
              ₹{spendingAmount ? (parseInt(spendingAmount) * 4).toLocaleString() : '0'}
              </span>
            </h2>
          </div>
        </div>

        <div className={`investment-graph-container ${hasScrolled ? 'visible' : ''}`}>
          <h3 className="graph-title">If invested in NVIDIA since 2020</h3>
          <div className="graph-content">
            <button 
              className={`play-button ${isAnimating ? 'hidden' : ''}`}
              onClick={startAnimation}
            >
              Find out?
            </button>
            {investmentData.map((data, index) => {
              const height = (data.value / maxValue) * 100;
              return (
                <div
                  key={index}
                  className={`graph-bar ${isAnimating ? 'animated' : ''}`}
                  style={{ 
                    '--final-height': `${height}%`,
                    animationDelay: `${index * 0.2}s`,
                  }}
                >
                  <span className="graph-label">
                    ₹{Math.round(data.value).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="graph-x-axis">
            {investmentData.map((data, index) => (
              <span key={index} className="x-label">{data.date}</span>
            ))}
          </div>
        </div>

        <div className={`bank-savings-container ${hasScrolled ? 'visible' : ''}`}>
          <h3 className="graph-title">If kept in a savings account (4% APY)</h3>
          <div className="graph-content">
            <button 
              className={`play-button ${isBankAnimating ? 'hidden' : ''}`}
              onClick={startBankAnimation}
            >
              Find out?
            </button>
            {calculateBankSavings(Number(spendingAmount)).map((data, index) => {
              const height = (data.value / maxValue) * 100;
              return (
                <div
                  key={index}
                  className={`graph-bar ${isBankAnimating ? 'animated' : ''}`}
                  style={{ 
                    '--final-height': `${height}%`,
                    animationDelay: `${index * 0.2}s`,
                  }}
                >
                  <span className="graph-label">
                    ₹{Math.round(data.value).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="graph-x-axis">
            {calculateBankSavings(Number(spendingAmount)).map((data, index) => (
              <span key={index} className="x-label">{data.date}</span>
            ))}
          </div>
        </div>

        <div className={`difference-container ${hasScrolled ? 'visible' : ''}`}>
          <div 
            className={`difference-amount ${isDifferenceVisible ? 'revealed' : ''}`}
            onClick={() => setIsDifferenceVisible(true)}
          >
            {!isDifferenceVisible ? '?' : 
              `₹${spendingAmount && investmentData.length > 0 && bankSavingsData.length > 0 ? 
                Math.round(
                  investmentData[investmentData.length - 1].value - 
                  bankSavingsData[bankSavingsData.length - 1].value
                ).toLocaleString() 
                : '0'}`
            }
          </div>
          <div className={`difference-text ${isDifferenceVisible ? 'revealed' : ''}`}>
            is the difference in money you could have earned
          </div>
        </div>

      </section>

      {/* Add button to navigate to Login */}
      <div className="dashboard-button-container">
        <Link to="/login">
          <button className="dashboard-button">Get Started</button>
        </Link>
      </div>

      <Footer hasScrolled={hasScrolled} />

      <svg
        ref={svgRef}
        width="1000"
        height="2000"
        viewBox="0 0 1000 2000"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="squiggle"
      >
        <path
          ref={pathRef}
          d="M-24.5 101C285 315 5.86278 448.291 144.223 631.238C239.404 757.091 559.515 782.846 608.808 617.456C658.101 452.067 497.627 367.073 406.298 426.797C314.968 486.521 263.347 612.858 322.909 865.537C384.086 1125.06 79.3992 1007.94 100 1261.99C144.222 1807.35 819 1325 513 1142.5C152.717 927.625 -45 1916.5 1191.5 1852"
          stroke="#CD3C2F"
          strokeWidth="30"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export default LandingPage;