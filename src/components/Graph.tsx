// Graph.tsx
"use client"

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { Chart, ChartConfiguration, ChartData, ScatterDataPoint, LinearScale } from 'chart.js/auto';
import { convexHull } from '@/app/script';

interface CartesianPlaneProps {
  disabled?: boolean;
  onPointUpdate?: (id: number, x: number, y: number) => void;
}

export interface CartesianPlaneRef {
  addDraggableDot: (x: number, y: number) => number;
  getAllPoints: () => number[][];
  addAnimatedLine: (startPoint: { x: number; y: number }, endPoint: { x: number; y: number }, duration: number,r:number,g:number,b:number) => void;
  deleteLine: () => void;
  deleteDot: (x: number, y: number) => void;
  deleteAllLines:()=> void;
  updateDotColor:(x: number, y: number, r:number,g:number,b:number) => void;

}

class Point {
  x: number;
  y: number;

  constructor(x: number = 0, y: number = 0) {
      this.x = x;
      this.y = y;
  }
}

const CartesianPlane = forwardRef<CartesianPlaneRef, CartesianPlaneProps>((props, ref) => {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedPointIndex, setDraggedPointIndex] = useState(-1);

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.style.pointerEvents = props.disabled ? 'none' : 'auto';
    }
  }, [props.disabled]);

  const deleteDot = (x: number, y: number) => {
    if (chartInstance.current) {
      const datasets = chartInstance.current.data.datasets;
      for (let i = 0; i < datasets.length; i++) {
        const dataset = datasets[i];
        if (Array.isArray(dataset.data) && dataset.data.length === 1) {
          const point = dataset.data[0];
          if (typeof point === 'object' && point !== null && 'x' in point && 'y' in point) {
            if (point.x === x && point.y === y) {
              // Remove the dataset
              datasets.splice(i, 1);
              // Update the chart
              chartInstance.current.update();
              // Exit the function as we've found and removed the dot
              return;
            }
          }
        }
      }
    }
  };
  CartesianPlane.displayName = 'CartesianPlane';

  const deleteAllLines=()=>{
    if (!chartInstance.current) return;
    for(let i = 0;i<chartInstance.current.data.datasets.length;i){
      if(chartInstance.current.data.datasets[i].data.length !==1){
        chartInstance.current.data.datasets.splice(i,1);
      }else{
        i+=1;
      }
    }
    chartInstance.current.update();


  }

  const addDraggableDot = (x: number, y: number) => {
    if (!chartInstance.current) return -1;

    const id = Date.now();
    const newDataset = {
      data: [{ x, y }],
      backgroundColor: 'red',
      borderColor: 'red',
      pointRadius: 6,
      pointHoverRadius: 8,
      customId: id
    };

    chartInstance.current.data.datasets.push(newDataset);
    chartInstance.current.update();
    return id;
  };

  const deleteLine = () => {
    if (!chartInstance.current) return;

    const datasets = chartInstance.current.data.datasets;
    datasets.splice(datasets.length - 3, 2);
    chartInstance.current.update();
  };

  const updateDotColor = (x: number, y: number, r:number,g:number,b:number) => {
    if (chartInstance.current) {
      const datasets = chartInstance.current.data.datasets;
      for (let i = 0; i < datasets.length; i++) {
        const dataset = datasets[i];
        if (Array.isArray(dataset.data) && dataset.data.length === 1) {
          const point = dataset.data[0];
          if (typeof point === 'object' && point !== null && 'x' in point && 'y' in point) {
            if (point.x === x && point.y === y) {
              // Calculate color based on position
  
              // Update dot color
              dataset.backgroundColor = `rgb(${r}, ${g}, ${b})`;
              dataset.borderColor = `rgb(${r}, ${g}, ${b})`;
  
              // Update the chart
              chartInstance.current.update();
              return;
            }
          }
        }
      }
    }
  };

  const addAnimatedLine = (startPoint: { x: number; y: number }, endPoint: { x: number; y: number }, duration: number = 1000,r:number,g:number,b:number) => {
    if (!chartInstance.current) return;

    const newDataset = {
      data: [startPoint, startPoint],
      borderColor: `rgba(${r}, ${g}, ${b}, 1)`,
      borderWidth: 2,
      pointRadius: 3,
      showLine: true
    };

    chartInstance.current.data.datasets.push(newDataset);
    chartInstance.current.update('none');

    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);

      const currentX = startPoint.x + (endPoint.x - startPoint.x) * progress;
      const currentY = startPoint.y + (endPoint.y - startPoint.y) * progress;

      newDataset.data[1] = { x: currentX, y: currentY };
      chartInstance.current?.update('none');

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  };

  const getAllPoints = (): number[][] => {
    if (!chartInstance.current) return [];
  
    const points: number[][] = [];
    
    chartInstance.current.data.datasets.forEach((dataset: any) => {
      if (Array.isArray(dataset.data) && dataset.data.length === 1 && dataset.customId !== undefined) {
        dataset.data.forEach((point: { x: any; y: any; }) => {
          if (point && typeof point === 'object' && 'x' in point && 'y' in point) {
            const x = point.x;
            const y = point.y;
            if (typeof x === 'number' && typeof y === 'number') {
              points.push([x, y, dataset.customId]);
            }
          }
        });
      }
    });
    return points;
  };

  useImperativeHandle(ref, () => ({
    addDraggableDot,
    getAllPoints,
    addAnimatedLine,
    deleteLine,
    deleteDot,
    deleteAllLines,
    updateDotColor
  }));

  useEffect(() => {
    if (chartRef.current) {
      const resizeObserver = new ResizeObserver(() => {
        if (chartInstance.current) {
          chartInstance.current.resize();
        }
      });
  
      resizeObserver.observe(chartRef.current.parentElement!);
  
      return () => {
        resizeObserver.disconnect();
      };
    }
  }, []);

  useEffect(() => {
    if (chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const chartData: ChartData<'scatter', ScatterDataPoint[]> = {
        datasets: [
          {
            label: 'Cartesian Plane',
            data: [
              { x: -20, y: 0 },
              { x: 20, y: 0 },
            ],
            borderColor: 'rgba(0, 0, 0, 1)',
            borderWidth: 1,
            pointRadius: 0,
            showLine: true
          },
          {
            label: 'Cartesian Plane',
            data: [
              { x: 0, y: -10 },
              { x: 0, y: 10 }
            ],
            borderColor: 'rgba(0, 0, 0, 1)',
            borderWidth: 1,
            pointRadius: 0,
            showLine: true
          }
        ]
      };

      const config: ChartConfiguration<'scatter', ScatterDataPoint[]> = {
        type: 'scatter',
        data: chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          scales: {
            x: {
              type: 'linear',
              position: 'center',
              min: -20,
              max: 20,
              title: {
                display: false,
                text: 'X-axis'
              },
              ticks: {
                stepSize: 2
              },
              grid: {
                color: 'rgba(0, 0, 0, 0.1)'
              }
            },
            y: {
              type: 'linear',
              position: 'center',
              min: -10,
              max: 10,
              title: {
                display: false,
                text: 'Y-axis'
              },
              ticks: {
                stepSize: 2
              },
              grid: {
                color: 'rgba(0, 0, 0, 0.1)'
              }
            }
          },
          plugins: {
            legend: {
              display: false
            },
          },
          backgroundColor: 'white',
        }
      };

      chartInstance.current = new Chart(chartRef.current, config);
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, []);

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!chartInstance.current) return;

    const chart = chartInstance.current;
    const points = chart.getElementsAtEventForMode(event.nativeEvent, 'nearest', { intersect: true }, false);

    if (points.length > 0) {
      setIsDragging(true);
      setDraggedPointIndex(points[0].datasetIndex);
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !chartInstance.current) return;

    const chart = chartInstance.current;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const xScale = chart.scales['x'] as LinearScale;
    const yScale = chart.scales['y'] as LinearScale;

    var newX = xScale.getValueForPixel(x);
    var newY = yScale.getValueForPixel(y);

    if (newX !== undefined && newY !== undefined) {
      newX = Math.min(Math.max(newX, -20), 20);
      newY = Math.min(Math.max(newY, -10), 10);
      chart.data.datasets[draggedPointIndex].data[0] = { x: newX, y: newY };
      chart.update('none');

      // Call the onPointUpdate prop using the custom ID
      const datasetId = (chart.data.datasets[draggedPointIndex] as any).customId;
      if (datasetId !== undefined && props.onPointUpdate) {
        props.onPointUpdate(datasetId, newX, newY);
      }

      let len = getAllPoints().length;
      if (chartInstance.current.data.datasets.length > len + 2) {
        var p = getAllPoints();
        var pp: Point[] = [];
        for (let i = 0; i < p.length; i++) {
          pp.push({ x: p[i][0], y: p[i][1] });
        }
        var points: Point[] = convexHull(pp, pp.length);
        for (let i = 0; i < chartInstance.current.data.datasets.length;) {
          if (chartInstance.current.data.datasets[i].data.length != 1) {
            chartInstance.current.data.datasets.splice(i, 1);
          } else {
            i++;
          }
        }
        const newDataset = {
          data: [{ x: points[0].x, y: points[0].y }, { x: points[points.length - 1].x, y: points[points.length - 1].y }],
          borderColor: `rgba(${133}, ${133}, ${133}, 1)`,
          borderWidth: 2,
          pointRadius: 3,
          showLine: true
        };
        chartInstance.current.data.datasets.push(newDataset);
        chart.update('none');
        for (let i = 0; i < points.length - 1; i++) {
          const newDataset = {
            data: [{ x: points[i].x, y: points[i].y }, { x: points[i + 1].x, y: points[i + 1].y }],
            borderColor: `rgba(${133}, ${133}, ${133}, 1)`,
            borderWidth: 2,
            pointRadius: 3,
            showLine: true
          };
          chartInstance.current.data.datasets.push(newDataset);
          chart.update('none');
        }
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedPointIndex(-1);
  };

  return (
    <div style={{ width: '100%', backgroundColor: 'white' }} className='pt-16 h-full'>
      <canvas 
        ref={chartRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  );
});

export default CartesianPlane;