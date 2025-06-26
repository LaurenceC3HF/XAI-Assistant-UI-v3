// Add at the top:
const FEATURE_GROUPS = {
  Performance: ['Response Time', 'Success Probability'],
  Risk: ['Collateral Risk'],
  Resource: ['Resource Availability'],
  // ...add your own
};
const FEATURE_EXPLANATIONS = {
  'Response Time': 'How quickly the system responds...',
  'Success Probability': 'Likelihood of mission success...',
  // ...add your own
};

// In your render:
{Object.entries(FEATURE_GROUPS).map(([group, features]) => (
  <div key={group}>
    <h4 className="font-semibold text-gray-400 mb-2">{group}</h4>
    {features
      .filter(f => shapData[f] !== undefined)
      .map(feature => (
        <div
          key={feature}
          className="group cursor-pointer relative"
          onMouseEnter={() => setTooltip(feature)}
          onMouseLeave={() => setTooltip(null)}
        >
          {/* ...existing feature bar rendering... */}
          {tooltip === feature && (
            <div className="absolute left-full top-1/2 ml-2 p-2 rounded bg-black text-white text-xs w-48">
              {FEATURE_EXPLANATIONS[feature] || "No explanation available."}
            </div>
          )}
        </div>
      ))}
  </div>
))}
