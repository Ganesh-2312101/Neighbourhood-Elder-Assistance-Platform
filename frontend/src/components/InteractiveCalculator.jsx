import React, { useState } from 'react';
import { Heart, ShoppingBag, Clock, ShieldCheck, Sparkles } from 'lucide-react';

export default function InteractiveCalculator() {
  const [seniorsCount, setSeniorsCount] = useState(15);

  const groceriesSaved = seniorsCount * 4;
  const hoursDelivered = seniorsCount * 6;
  const safetyChecks = seniorsCount * 8;

  return (
    <div className="interactive-calculator-card">
      <div className="calculator-header">
        <span className="editorial-tagline-pill">
          <Sparkles style={{ width: 14, height: 14 }} /> Interactive Impact Estimator
        </span>
        <h3>See the Real Impact in Your Neighborhood</h3>
        <p>Adjust the slider to estimate monthly community benefits</p>
      </div>

      {/* Interactive Range Slider */}
      <div className="calculator-slider-container">
        <div className="slider-label-row">
          <span>Number of Seniors Assisted:</span>
          <span className="slider-value-display">{seniorsCount} Seniors</span>
        </div>
        <input 
          type="range" 
          min="1" 
          max="100" 
          value={seniorsCount}
          onChange={(e) => setSeniorsCount(parseInt(e.target.value))}
          className="interactive-range-slider"
        />
        <div className="slider-ticks">
          <span>1 Senior</span>
          <span>50 Seniors</span>
          <span>100 Seniors</span>
        </div>
      </div>

      {/* Dynamic Calculated Output Grid */}
      <div className="calculator-results-grid">
        <div className="calc-result-card blue">
          <ShoppingBag style={{ width: 24, height: 24 }} />
          <div className="calc-val">{groceriesSaved}</div>
          <div className="calc-lbl">Grocery & Medicine Deliveries / Mo</div>
        </div>

        <div className="calc-result-card green">
          <Clock style={{ width: 24, height: 24 }} />
          <div className="calc-val">{hoursDelivered} hrs</div>
          <div className="calc-lbl">Companionship & Walk Hours / Mo</div>
        </div>

        <div className="calc-result-card amber">
          <ShieldCheck style={{ width: 24, height: 24 }} />
          <div className="calc-val">{safetyChecks}</div>
          <div className="calc-lbl">Verified Safety Check-Ins / Mo</div>
        </div>
      </div>
    </div>
  );
}
