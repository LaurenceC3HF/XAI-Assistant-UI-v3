import React, { useRef, useState } from 'react';
import { VisualCard } from './VisualCard';
import { TrendingUp, TrendingDown, Info } from 'lucide-react';

// Example group and explanation definitions (adapt as needed)
const FEATURE_GROUPS: Record<string, string[]> = {
  Performance: ['Response Time', 'Success Probability', 'Speed Increase'],
  Risk: ['Collateral Risk'],
  Resource: ['Resource Availability'],
  Other: []
};
const FEATURE_EXPLANATIONS: Record<string, string> = {
  'Response Time': 'How quickly the system or actor responds to an event.',
  'Success Probability': 'The likelihood of achieving the desired outcome.',
  'Speed Increase': 'Indicates a sudden increase in speed, which can change mission risk.',
  'Collateral Risk': 'Potential negative consequences or side effects.',
  'Resource Availability': 'How many assets are available for the operation.'
  // Add more as needed
};

interface SHAPVisualProps {
  shapData?: Record<string, number>;
  onVisualizationHover?: (elementId: string, visualizationType: string) => () => void;
  onVisualizationClick?: (elementId: string, visualizationType: string) => void;
}

export const SHAPVisual: React.FC<SHAPVisualProps> = ({
  shapData,
  onVisualizationHover,
  onVisualizationClick
}) => {
  const cleanupFunctions = useRef<Record<string, (() => void) | null>>({});
  const [tooltipFeature, setTooltipFeature] = useState<string | null>(null);

  if (!shapData) return null;

  // Build grouped features
  const groupedFeatures = Object.entries(FEATURE_GROUPS).reduce((acc, [group, features]) => {
    const present = features.filter(f => shapData[f] !== undefined);
    if (present.length > 0) acc[group] = present;
    return acc;
  }, {} as Record<string, string[]>);
  // Add any uncategorized features to "Other"
  const groupedFeatureSet = new Set(Object.values(FEATURE_GROUPS).flat());
  const otherFeatures = Object.keys(shapData).filter(f => !groupedFeatureSet.has(f));
  if (otherFeatures.length) groupedFeatures['Other'] = otherFeatures;

  const features = Object.entries(shapData).sort(([, a], [, b]) => Math.abs(b) - Math.abs(a));
  const maxAbsValue = Math.max(...features.map(([, v]) => Math.abs(v)));

  const handleMouseEnterFeature = (feature: string) => {
    setTooltipFeature(feature);
    const cleanup = onVisualizationHover?.(feature, 'shap_feature');
    if (cleanup) {
      cleanupFunctions.current[feature] = cleanup;
    }
  };

  const handleMouseLeaveFeature = (feature: string) => {
    setTooltipFeature(null);
    const cleanup = cleanupFunctions.current[feature];
    if (cleanup) {
      cleanup();
      cleanupFunctions.current[feature] = null;
    }
  };

  const handleFeatureClick = (feature: string) => {
    onVisualizationClick?.(feature, 'shap_feature');
  };

  return (
    <VisualCard>
      <div className="flex items-center mb-6">
        <TrendingUp className="w-6 h-6 text-teal-400 mr-3" />
        <h3 className="text-lg font-semibold text-teal-300">
          SHAP Feature Importance
        </h3>
      </div>

      {Object.entries(groupedFeatures).map(([group, features]) => (
        <div key={group} className="mb-4">
          {group !== 'Other' && (
            <div className="font-bold text-gray-400 text-xs uppercase mb-2 flex items-center gap-1">
              <Info className="w-3 h-3 mr-1" />
              {group}
            </div>
          )}
          <div className="space-y-3">
            {features.map(feature => {
              const value = shapData[feature];
              return (
                <div
                  key={feature}
                  className="group cursor-pointer relative"
                  onMouseEnter={() => handleMouseEnterFeature(feature)}
                  onMouseLeave={() => handleMouseLeaveFeature(feature)}
                  onClick={() => handleFeatureClick(feature)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                      {feature}
                    </span>
                    <div className="flex items-center">
                      {value > 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-400 mr-1" />
                      )}
                      <span className={`text-sm font-bold ${value > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {value.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="relative bg-slate-700/50 rounded-full h-3 overflow-hidden">
                    <div
                      style={{ width: `${(Math.abs(value) / maxAbsValue) * 100}%` }}
                      className={`
                        h-full transition-all duration-500 ease-out
                        ${value > 0
                          ? 'bg-gradient-to-r from-green-500 to-green-400'
                          : 'bg-gradient-to-r from-red-500 to-red-400'
                        }
                      `}
                    />
                  </div>
                  {tooltipFeature === feature && (
                    <div className="absolute top-0 left-full ml-2 z-40 w-52 bg-black bg-opacity-90 text-white text-xs p-2 rounded shadow-lg pointer-events-none">
                      <div className="flex items-center mb-1">
                        <Info className="w-3 h-3 mr-1 text-blue-400" />
                        <span className="font-bold">{feature}</span>
                      </div>
                      {FEATURE_EXPLANATIONS[feature] || "No explanation available."}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </VisualCard>
  );
};
