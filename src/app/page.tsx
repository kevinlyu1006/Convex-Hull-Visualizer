// Page.tsx
"use client"

import React, { useRef, useState } from "react";
import CartesianPlane, { CartesianPlaneRef } from "@/components/Graph";
import { Toolbar, IconButton, Typography, Divider, List, ListItem, ListItemText } from "@mui/material";
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import { styled } from '@mui/material/styles';
import MuiDrawer from '@mui/material/Drawer';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import MenuIcon from '@mui/icons-material/Menu';
import DeleteIcon from '@mui/icons-material/Delete';
import TimelineIcon from '@mui/icons-material/Timeline';
import AdjustIcon from '@mui/icons-material/Adjust';
import { convexHull2 } from "./script";

var running = false;
const drawerWidth: number = 200;

class Point {
  x: number;
  y: number;

  constructor(x: number , y: number) {
      this.x = x;
      this.y = y;
  }
}

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

var points: Point[] = [];
let p0: Point = new Point(0, 0);

function nextToTop(S: Point[]): Point {
    return S[S.length - 2];
}

function distSq(p1: Point, p2: Point): number {
    return ((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y));
}

function orientation(p: Point, q: Point, r: Point): number {
    let val = ((q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y));
    if (val === 0) return 0;
    return (val > 0) ? 1 : 2;
}

function compare(p1: Point, p2: Point): number {
    let o = orientation(p0, p1, p2);
    if (o === 0) {
        return (distSq(p0, p2) >= distSq(p0, p1)) ? -1 : 1;
    }
    return (o === 2) ? -1 : 1;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    '& .MuiDrawer-paper': {
      position: 'relative',
      whiteSpace: 'nowrap',
      width: drawerWidth,
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
      boxSizing: 'border-box',
      ...(!open && {
        overflowX: 'hidden',
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
        width: theme.spacing(7),
        [theme.breakpoints.up('sm')]: {
          width: theme.spacing(7),
        },
      }),
    },
  }),
);

var pop = false;

export default function Home() {
  const [open, setOpen] = useState(true);
  const chartRef = useRef<CartesianPlaneRef>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [points, setPoints] = useState<{id: number, x: number, y: number}[]>([]);
  const [lines,setLines] = useState(false);
  const [buttonState,setButtonState] = useState("Start Animation");
  function addLineWithDelay(start: Point, end: Point, duration: number, r:number,g:number,b:number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (chartRef.current) {
          chartRef.current.addAnimatedLine(
            { x: start.x, y: start.y },
            { x: end.x, y: end.y },
            duration,r,g,b
          );
        }
        resolve();
      }, duration);
    });
  }

  const toggleDrawer = () => {
    setOpen(!open);
  };

  const handleAddDot = () => {
    if (chartRef.current && !running) {
      const x = Math.random() * 40 - 20;
      const y = Math.random() * 20 - 10;
      const newPoint = { id: Date.now(), x, y };
      chartRef.current.addDraggableDot(x, y);
      setPoints(prevPoints => [...prevPoints, newPoint]);
    }
  };
  const handleDelete = (x:number,y:number, id:number)=>{
    setPoints(prevPoints => points.filter(function(item:{id:number,x:number,y:number}){
      return item.id!== id;

    }));
    chartRef.current?.deleteDot(x,y);
  }

  const handlePointUpdate = (id: number, x: number, y: number) => {
    setPoints(prevPoints => 
      prevPoints.map(point => 
        point.id === id ? { ...point, x, y } : point
      )
    );
  };

  async function convexHull(points: Point[], n: number): Promise<void>  {
    running = true;
    let tot = convexHull2(points,n);

    let lines: Point[][] = [];
    let ymin = points[0].y;
    let min = 0;
    for (let i = 1; i < n; i++) {
        let y = points[i].y;
        if ((y < ymin) || (ymin === y && points[i].x < points[min].x)) {
            ymin = points[i].y;
            min = i;
        }
    }
    [points[0], points[min]] = [points[min], points[0]];
    p0 = points[0];
    points.sort(compare);
    chartRef.current?.updateDotColor(p0.x,p0.y,0,0,0);
    let c2 = (222-116)/(points.length-1);
    let c3 = (26-0)/(points.length-1);
    for(let i = 1;i<points.length;i++){
      chartRef.current?.updateDotColor(points[i].x,points[i].y,255,222-c2*(i-1),26-c3*(i-1));
      await new Promise(resolve => setTimeout(resolve, 600));


    }
    let m = 1;
    for (let i = 1; i < n; i++) {
        while (i < n - 1 && orientation(p0, points[i], points[i + 1]) === 0)
            i++;
        points[m] = points[i];
        m++;
    }
    if (m < 3) return;
    let S: Point[] = [];
    S.push(points[0]);
    var c1 = (174-22)/tot;
    c2 = (232-35)/tot;
    c3 = (254-77)/tot;
    await addLineWithDelay(points[0], points[1], 1000,174,232,254);
    lines.push([points[0], points[1]]);
    S.push(points[1]);
    await addLineWithDelay(points[1], points[2], 1000,174-c1,232-c2,254-c3);
    lines.push([points[1], points[2]])
    S.push(points[2]);
    let l = 2;
    for (let i = 3; i < m; i++) {
        pop = false;
        while (S.length >= 2 && orientation(nextToTop(S), S[S.length - 1], points[i]) !== 2) {
          if (!pop && !lines.includes([S[S.length-1], points[i]])) {
            await addLineWithDelay(S[S.length-1], points[i], 1000,174-l*c1,232-l*c2,254-l*c3 );
            l+=1;
            lines.push([S[S.length-1], points[i]]);
          }
          pop = true;
          S.pop();
          if (!lines.includes([S[S.length-1], points[i]])) {
            await addLineWithDelay(S[S.length-1], points[i], 1000,174-l*c1,232-l*c2,254-l*c3 );
            l+=1;
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          chartRef.current?.deleteLine();
          lines.push([S[S.length-1], points[i]])
        }
        S.push(points[i]);
        if (!pop && !lines.includes([nextToTop(S), S[S.length-1]])) {
          await addLineWithDelay(nextToTop(S), S[S.length-1], 1000, 174-l*c1,232-l*c2,254-l*c3 );
          l+=1;
          lines.push([nextToTop(S), S[S.length-1]]);
        }
    }
    if (S.length > 2) {
      await addLineWithDelay(S[S.length - 1], S[0], 1000,174-l*c1,232-l*c2,254-l*c3 );
      l+=1;
    }
    running = false;
  }

  async function handleStart() {
    
    if(!lines && points.length>=3){
      setLines(true);

      setButtonState("Reset");
      var poin = [];
      if (chartRef.current && !isRunning) {
        setIsRunning(true);
        var pp: number[][] = chartRef.current.getAllPoints();
        for (let a = 0; a < pp.length; a++) {
          poin.push(new Point(pp[a][0], pp[a][1]));
        }
      }
      try {
        await convexHull(poin, poin.length);
        //chartRef.current?.deleteAllLines();
      } finally {
        setIsRunning(false);
      }

    }else if(lines){
      setButtonState("Start Animation");

      setLines(false);
      chartRef.current?.deleteAllLines();
      if(chartRef.current){
        var pp: number[][] = chartRef.current.getAllPoints();
        for(let i = 0;i<pp.length;i++){
          chartRef.current?.updateDotColor(pp[i][0],pp[i][1],255,0,0);
        }
      }

      
    }
    
  }

  return (
    <div className="flex flex-col h-screen">
      <AppBar position="absolute" open={open}>
        <Toolbar
          sx={{
            pr: '24px',
          }}
          className='bg-black border-b border-[#444C4A]'
        >
          <IconButton
            edge="start"
            color="inherit"
            aria-label="open drawer"
            onClick={toggleDrawer}
            sx={{
              marginRight: '36px',
              ...(open && { display: 'none' }),
            }}
          >
            <MenuIcon />
          </IconButton >
          <Typography
            component="h1"
            variant="h6"
            color="inherit"
            noWrap
            sx={{ flexGrow: 1 }}
          >
            Convex Hull Finder
          </Typography>
          <button onClick={handleAddDot} disabled={lines} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mx-5">
            Add Point
          </button>
          <button disabled={isRunning} onClick={() => handleStart().catch(console.error)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            {buttonState}
          </button>
        </Toolbar>
      </AppBar>
      <div className="flex flex-grow overflow-hidden">
        <Drawer variant="permanent" open={open} className="h-full">
          <Toolbar style={{minHeight:"55px"}}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              px: [1],
              
            }}
          >
            <h1 className="text-gray-800 font-bold text-2xl h-4 pr-10">
              Points
            </h1>
            <IconButton onClick={toggleDrawer}>
              <ChevronLeftIcon />
            </IconButton>
          </Toolbar>
          <List component="nav" className="flex-grow">
            <Divider className="m-0" sx={{ my: 1 }} />
          
            {open && points.map((point) => (
              <div key={point.id}>
                <ListItem  key={point.id}>
                  <ListItemText primary={<Typography style={{color: "rgb(50,50,50)", fontWeight: 'bold'}}>
                    {`P: (${point.x.toFixed(2)}, ${point.y.toFixed(2)})`}
                </Typography>} />
                  <button className="rounded-xl hover:bg-gray-200" disabled={lines} onClick={()=>handleDelete(point.x,point.y,point.id)}>
                    <DeleteIcon color="disabled" />
                  </button>
                  </ListItem>
                <Divider />
              </div>
            
            ))}

{!open && points.map((point) => (
              <div key={point.id}>
                <ListItem  key={point.id}>
                <button className="rounded-xl hover:bg-gray-200" disabled={lines} onClick={()=>handleDelete(point.x,point.y,point.id)}>
                    <DeleteIcon color="disabled" />
                  </button>
                  </ListItem>
                <Divider />
              </div>
              

            ))}
          </List>
        </Drawer>
        
        <div className={`flex-grow transition-all duration-200 ${open ? 'h-full w-64' : 'h-full w-full'}`}>
          <CartesianPlane 
            ref={chartRef} 
            disabled={isRunning} 
            onPointUpdate={handlePointUpdate}
          />
        </div>
      </div>
    </div>
  );
}