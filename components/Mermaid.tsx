import React, { useEffect, useState, useMemo } from 'react';
import mermaid from 'mermaid';

interface MermaidProps {
  chart: string;
}

let mermaidIdCounter = 0;
let mermaidInitialized = false;

const Mermaid: React.FC<MermaidProps> = ({ chart }) => {
  const [svg, setSvg] = useState<string>('');
  const id = useMemo(() => `mermaid-${mermaidIdCounter++}`, []);

  useEffect(() => {
    const renderChart = async () => {
      try {
        // Initialize mermaid only once
        if (!mermaidInitialized) {
          mermaid.initialize({
            startOnLoad: false,
            theme: 'dark',
            themeVariables: {
              primaryColor: '#667eea',
              primaryTextColor: '#fff',
              primaryBorderColor: '#7c3aed',
              lineColor: '#5a67d8',
              secondaryColor: '#764ba2',
              tertiaryColor: '#667eea',
              background: '#1a202c',
              mainBkg: '#2d3748',
              secondBkg: '#4a5568',
              tertiaryBkg: '#718096',
              textColor: '#fff',
              nodeTextColor: '#fff',
            }
          });
          mermaidInitialized = true;
        }
        
        const { svg: renderedSvg } = await mermaid.render(id, chart);
        setSvg(renderedSvg);
      } catch (error) {
        console.error('Mermaid rendering error:', error);
        setSvg(`<pre>${chart}</pre>`);
      }
    };

    renderChart();
  }, [chart, id]);

  return (
    <div 
      className="mermaid-rendered"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

export default Mermaid;