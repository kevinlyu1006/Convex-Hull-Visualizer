// TypeScript program to find convex hull of a set of
// points. Refer
// https://www.geeksforgeeks.org/orientation-3-ordered-points/
// for explanation of orientation()

import React, { useRef, useState } from "react";

// A class used to store the x and y coordinates of points
class Point {
    x: number;
    y: number;

    constructor(x: number = 0, y: number = 0) {
        this.x = x;
        this.y = y;
    }
}

// A global point needed for sorting points with reference
// to the first point
let p0: Point = new Point(0, 0);

// A utility function to find next to top in a stack
function nextToTop(S: Point[]): Point {
    return S[S.length - 2];
}

// A utility function to return square of distance
// between p1 and p2
function distSq(p1: Point, p2: Point): number {
    return ((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y));
}

// To find orientation of ordered triplet (p, q, r).
// The function returns following values
// 0 --> p, q and r are collinear
// 1 --> Clockwise
// 2 --> Counterclockwise
function orientation(p: Point, q: Point, r: Point): number {
    let val = ((q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y));
    if (val === 0) return 0; // collinear
    return (val > 0) ? 1 : 2; // clock or counterclock wise
}

// A function used by cmp_to_key function to sort an array
// of points with respect to the first point
function compare(p1: Point, p2: Point): number {
    // Find orientation
    let o = orientation(p0, p1, p2);
    if (o === 0) {
        return (distSq(p0, p2) >= distSq(p0, p1)) ? -1 : 1;
    }
    return (o === 2) ? -1 : 1;
}

// Prints convex hull of a set of n points.


// Driver Code

// This code is contributed by phasing17
export function convexHull(points: Point[], n: number): Point[]  {
    // Find the bottommost point
    let lines:Point[][] = [];
    let ymin = points[0].y;
    let min = 0;
    for (let i = 1; i < n; i++) {
        let y = points[i].y;

        // Pick the bottom-most or choose the left
        // most point in case of tie
        if ((y < ymin) || (ymin === y && points[i].x < points[min].x)) {
            ymin = points[i].y;
            min = i;
        }
    }

    // Place the bottom-most point at first position
    [points[0], points[min]] = [points[min], points[0]];

    // Sort n-1 points with respect to the first point.
    // A point p1 comes before p2 in sorted output if p2
    // has larger polar angle (in counterclockwise
    // direction) than p1
    p0 = points[0];
    points.sort(compare);

    // If two or more points make same angle with p0,
    // Remove all but the one that is farthest from p0
    let m = 1; // Initialize size of modified array
    for (let i = 1; i < n; i++) {
        // Keep removing i while angle of i and i+1 is same
        // with respect to p0
        while (i < n - 1 && orientation(p0, points[i], points[i + 1]) === 0)
            i++;

        points[m] = points[i];
        m++;
    }

    // If modified array of points has less than 3 points,
    // convex hull is not possible
    if (m < 3) return []

    // Create an empty stack and push first three points
    // to it.
    let S: Point[] = [];
    S.push(points[0]);
    S.push(points[1]);
    S.push(points[2]);

    // Process remaining n-3 points
    for (let i = 3; i < m; i++) {
        // Keep removing top while the angle formed by
        // points next-to-top, top, and points[i] makes
        // a non-left turn
        while (S.length >= 2 && orientation(nextToTop(S), S[S.length - 1], points[i]) !== 2) {
                

          S.pop();


          // Wait for the animation to complete before deleting


  
  
      }
        S.push(points[i]);
    }
    var res:Point[] = [];
    while (S.length > 0) {
        let p = S[S.length - 1];
        res.push({x:p.x,y:p.y});
        S.pop();
    }
    return res;

}




export function convexHull2(points: Point[], n: number): number {
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
    
    let m = 1;
    for (let i = 1; i < n; i++) {
        while (i < n - 1 && orientation(p0, points[i], points[i + 1]) === 0)
            i++;
        points[m] = points[i];
        m++;
    }
    var res = 0;
    if (m < 3) return 0;
    let S: Point[] = [];
    S.push(points[0]);
    res+=1;
    lines.push([points[0], points[1]]);
    S.push(points[1]);
    res+=1;
    lines.push([points[1], points[2]])
    S.push(points[2]);
    for (let i = 3; i < m; i++) {
        var pop = false;
        while (S.length >= 2 && orientation(nextToTop(S), S[S.length - 1], points[i]) !== 2) {
          if (!pop && !lines.includes([S[S.length-1], points[i]])) {
            res+=1;
            lines.push([S[S.length-1], points[i]]);
          }
          pop = true;
          S.pop();
          if (!lines.includes([S[S.length-1], points[i]])) {
            res+=1;
          }
          lines.push([S[S.length-1], points[i]])
        }
        S.push(points[i]);
        if (!pop && !lines.includes([nextToTop(S), S[S.length-1]])) {
            res+=1;
            lines.push([nextToTop(S), S[S.length-1]]);
        }
    }
    if (S.length > 2) {
        res+=1;
    }
    return res;
  }