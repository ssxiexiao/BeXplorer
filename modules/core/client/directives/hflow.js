(function () {
  'use strict';
  let svgConf = {
    width: 2000,
    height: 600,
    padding: 20
  };
  svgConf.xs = 0 + svgConf.padding;
  svgConf.xe = svgConf.width - svgConf.padding;
  svgConf.ys = 0 + svgConf.padding;
  svgConf.ye = svgConf.height - svgConf.padding;
  let influence;
  let backgroundColor = '#f1f1f1';
  let colorConf = ['#984ea3', '#ff7f00', '#ffff33', '#1b9e77']; //color of role
  let barScale = [Infinity, -Infinity]; //extent of influence value
  angular
    .module('core')
    .directive('hierFlow', function($window) {
      var link = function(scope, el, attr) {
        let d3 = $window.d3;
        let svg = d3.select(el[0]);
        scope.$watch(function() {
          return scope.receive;
        }
        , function() {
          if(scope.receive === 2) {
            let cons = scope.consumption;
            let inf = scope.influence.influence1;
            influence = inf;
            console.log('consumption sequence', cons);
            console.log('influence sequence', inf);
            let timestep = Object.keys(cons);
            timestep.sort();
            let consMat = genConsFlow(d3, cons);
            let infMat = genInfFlow(d3, inf);
            renderText(d3, svg, timestep);
            renderStackedTree(d3, svg, consMat, infMat);
          }
        });
      };
      return {
        restrict: 'EA',
        template: '<svg width=2000 height=600></svg>',
        replace: true,
        scope: {
          consumption: '=consumption',
          influence: '=influence',
          receive: '=receive'
        },
        link: link
      };
    });
  function clearFlow(d3, svg) {
    svg.selectAll('.flow').remove();
  }
  function renderText(d3, svg, seq) {
    let xScale = d3.scale.linear()
      .domain([0, seq.length-1])
      .range([svgConf.xs, svgConf.xe]);
    svg.selectAll('text')
      .data(seq)
      .enter()
      .append('text')
      .attr('x', function(d, i){ return xScale(i); })
      .attr('y', 40)
      .attr('text-anchor', 'middle')
      .style({ 'font-weight': 'bolder'})
      .attr('fill', 'grey')
      .text(function(d){
        return d;
      })
      .attr('font-size', 10)
      .attr('transform',function(d, i){
        return 'rotate(-45,'+xScale(i)+','+30+')';
      });
  }
  function renderStackedTree(d3, svg, consMat, infMat) {
    let n = 8;
    let interval = 5;
    let seq = d3.range(n);
    let conf = { xs: 0, xe: 5, ys: svgConf.ys+50, ye: svgConf.ye };
    let yScale = d3.scale.linear()
      .domain([0, n])
      .range([conf.ys, conf.ye]);
    svg.selectAll('.stackedTree')
      .data(seq)
      .enter()
      .append('rect')
      .classed('stackedTree', true)
      .attr('x', function() { return conf.xs; })
      .attr('y', function(d, i) { return yScale(i); })
      .attr('width', function() { return 10; })
      .attr('height', function(d, i) { return yScale(1) - yScale(0) - interval; })
      .attr('fill', '#999')
      .attr('rx', 5)
      .attr('ry', 5)
      .on('click', function(d, i) {
        if(d3.select(this).attr('x') == conf.xs) d3.select(this).attr('x', conf.xe);
        else d3.select(this).attr('x', conf.xs);
        let tmp = [];
        d3.selectAll('.stackedTree').each(function(d, i) { if(d3.select(this).attr('x') == conf.xe) tmp.push(i); });
        // d3.select(this).attr('stroke', '#ffaf56').attr('stroke-width', 1);
        // d3.select(this).attr('x', conf.xs);
        let newCons = [];
        let newInf = [];
        for(let i of tmp) {
          newCons.push(consMat[i]);
          newInf = newInf.concat(infMat.slice(i*n, (i+1)*n));
        }
        clearFlow(d3, svg);
        if(newCons.length) renderFlow(d3, svg, newCons, newInf);
      });
  }
  function renderFlow(d3, svg, cons, inf) {
    for(let i = 0; i < cons.length; i++) {
      let offset1 = d3.max(cons[i], function(d) { return d.y/2; });
      let offset2 = i > 0 ? d3.max(cons[i-1], function(d) { return d.y0+d.y; }) : 0;
      cons[i].map(function(d) { d.y0 = (-d.y/2) + offset1 + offset2; });
    }
    inf = filterInfFlow(d3, inf);
    transformLayout(d3, inf, cons);
    let xScale = d3.scale.linear()
      .domain([0, cons[0].length-1])
      .range([svgConf.xs, svgConf.xe]);
    let yScale = d3.scale.linear()
      .domain([0, d3.max(cons[cons.length-1], function(d) { return d.y0+d.y; })])
      .range([svgConf.ys+50, svgConf.ye]);
    let area = d3.svg.area()
    .x(function(d) { return xScale(d.x); })
    .y0(function(d) { return yScale(d.y0); })
    .y1(function(d) { return yScale(d.y0 + d.y); })
    .interpolate('cardinal');
    let data = cons.concat(inf);
    let n = cons.length;
    svg.selectAll('.flow')
      .data(data)
      .enter()
      .append('path')
      .classed('flow', true)
      .attr('d', area)
      .attr('fill', function(d, i) {
        if(i < n) return backgroundColor;
        else return colorConf[(i-n)%4];
      })
      .attr('fill-opacity', function(d, i) {
        if(i < n) return 1;
        else if((i-n)%8 < 4) return 0.4;
        else return 0.9;
      })
      .on('click', function(d, i) {
        let m = 8; // role number
        let q = 3; //mechanism number
        if(i >= n) {
          let pos = d3.mouse(this);
          let t = 0;
          for(let j = 0; j < d.length - 1; j++) {
            if(xScale(d[j].x) <= pos[0] && xScale(d[j+1].x) > pos[0]) {
              if(Math.abs(pos[0] - xScale(d[j].x)) < Math.abs(pos[0] - xScale(d[j+1].x))) t = j;
              else t = j + 1;
              break;
            }
          }
          let tmp = [];
          d3.selectAll('.stackedTree').each(function(d, i) { if(d3.select(this).attr('x') == 5) tmp.push(i); });
          let r1 = tmp[parseInt((i-n)/m)];
          let r2 = (i-n)%m;
          let timestep = Object.keys(influence);
          timestep.sort();
          let roleKeys = Object.keys(influence[timestep[t]]);
          roleKeys.sort();
          let data = influence[timestep[t]][roleKeys[r1]];
          let prodKeys = Object.keys(data);
          let newData = [];
          for(let j = 0; j < q; j++) newData.push(0);
          for(let j = 0; j < prodKeys.length; j++) {
            for(let k = 0; k < newData.length; k++) {
              newData[k] += data[prodKeys[j]][(k*m)+r2];
            }
          }
          console.log(timestep[t], r1, r2, newData);
          renderBar(d3, svg, newData, pos, timestep[t]);
        }
      });
  }
  function renderBar(d3, svg, data, pos, time) {
    let conf = { width: 200, height: 100, padding:10 };
    let color = ['#03a9f4', '#f52800', '#2ecc71'];
    conf.xs = conf.padding;
    conf.xe = conf.width - conf.padding;
    conf.ys = conf.padding;
    conf.ye = conf.height - conf.padding;
    conf.barWidth = (conf.xe - conf.xs) * 0.8 / data.length;
    conf.barInterval = (conf.xe - conf.xs) * 0.2 / (data.length + 1);
    let yScale = d3.scale.linear()
      .domain([0, barScale[1]])
      .range([0, conf.ye-conf.ys]);
    let g = svg.append('g').classed('mechanism', true);
    g.attr('transform', 'translate('+pos[0]+','+pos[1]+')');
    let drag = d3.behavior.drag();
    let px, py;
    drag.on('dragstart', function() {
      // console.log('dragstart', d3.mouse(this));
      d3.event.sourceEvent.stopPropagation(); // silence other listeners
      px = -d3.mouse(this)[0];
      py = -d3.mouse(this)[1];
    });
    drag.on('drag', function() {
      let x = d3.event.x + px;
      let y = d3.event.y + py;
      d3.select(this).attr('transform', 'translate('+x+','+y+')');
      d3.select(this).select('line').attr('x1',pos[0]).attr('y1',pos[1]).attr('x2',x+(conf.width/2)).attr('y2',y+(conf.height/2))
        .attr('stroke', '#00a').attr('stroke-width', 1).attr('transform', 'translate('+(-x)+','+(-y)+')');
    });
    drag.on('dragend', function() {
    });
    g.call(drag);
    g.on('dblclick', function() {
      d3.select(this).remove();
      // console.log('dblclick');
    });
    g.style({ 'cursor': 'move' });
    g.append('line');
    g.append('rect')
      .attr('width', conf.width)
      .attr('height', conf.height)
      .attr('rx', 10)
      .attr('ry', 10)
      .attr('fill', '#fff')
      .attr('stroke', '#aaa');
    g.append('text')
      .attr('x', (conf.xs+conf.xe)/2)
      .attr('y', conf.ys)
      .attr('text-anchor', 'middle')
      .style('font-weight', 'bolder')
      .attr('fill', 'grey')
      .text(time)
      .attr('font-size', 10);
    g.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .classed('bar', true)
      .attr('width', conf.barWidth)
      .attr('height', function(d) {
        return yScale(d);
      })
      .attr('x', function(d, i) {
        return conf.xs + ((i+1)*conf.barInterval) + (i*conf.barWidth);
      })
      .attr('y', function(d, i) {
        return conf.ye - yScale(d);
      })
      .attr('fill', function(d, i) {
        return color[i];
      })
      .attr('fill-opacity', 0.7);
  }
  function genConsFlow(d3, seq) {
    let timestep = Object.keys(seq);
    timestep.sort();
    let cons = timestep.map(function(t, i) {
      let roleKeys = Object.keys(seq[t]);
      roleKeys.sort();
      return roleKeys.map(function(r) {
        let prodKeys = Object.keys(seq[t][r]);
        let sum = 0;
        for( let p of prodKeys ) {
          sum += parseFloat(seq[t][r][p]);
        }
        return { y: sum, x: i , y0: sum * -0.5};
      });
    });
    let newCons = [];
    for(let i = 0; i < cons.length; i++) {
      for(let j = 0; j < cons[i].length; j++) {
        if(i === 0) newCons.push([]);
        newCons[j].push(cons[i][j]);
      }
    }
    return newCons;
  }
  function genInfFlow(d3, seq) {
    let timestep = Object.keys(seq);
    timestep.sort();
    let newInf = [];
    let inf = timestep.map(function(t) {
      let roleKeys = Object.keys(seq[t]);
      roleKeys.sort();
      let n = roleKeys.length;
      return roleKeys.map(function(r) {
        let prodKeys = Object.keys(seq[t][r]);
        let sum = (d3.range(n)).map(function() { return 0; });
        let tmp = (d3.range(n*3)).map(function() { return 0; });
        for( let p of prodKeys ) {
          for(let i = 0; i < n; i++) {
            sum[i] += Math.abs(parseFloat(seq[t][r][p][i])) + Math.abs(parseFloat(seq[t][r][p][n+i])) + Math.abs(parseFloat(seq[t][r][p][(2*n)+i]));
          }
          seq[t][r][p].map(function(d, i) { tmp[i]+=d; });
        }
        barScale[0] = Math.min(barScale[0], d3.min(tmp));
        barScale[1] = Math.max(barScale[1], d3.max(tmp));
        return sum;
      });
    });
    for(let i = 0; i < inf.length; i++) {
      for(let j = 0; j < inf[i].length; j++) {
        for(let k = 0; k < inf[i][j].length; k++) {
          if(i === 0) newInf.push([]);
          newInf[(j*inf[i][j].length)+k].push({ y:inf[i][j][k], x: i, y0: -inf[i][j][k]/2 });
        }
      }
    }
    return newInf;
  }
  //return accumulated value of several time series
  function accumulate(seq) {
    let result = [];
    for(let i = 0; i < seq.length; i++) {
      for(let j = 0; j < seq[i].length; j++) {
        if(i === 0) result.push(seq[i][j].y);
        else result[j] += seq[i][j].y;
      }
    }
    return result;
  }
  //symmetry layout
  function symmetryLayout(seq) {
    let gn = accumulate(seq);
    let g0 = gn.map(function(d) { return -d/2; });
    for(let i = 0; i < seq.length; i++) {
      for(let j = 0; j < seq[i].length; j++) {
        if(i === 0) seq[i][j].y0 = g0[j];
        else seq[i][j].y0 = seq[i-1][j].y0 + seq[i-1][j].y;
      }
    }
  }
  //transform to area
  function transformLayout(d3, seq, area) {
    let gn = [];
    let n = 8;
    let scale = Infinity;
    for(let i = 0; i < area.length; i++) {
      gn.push(accumulate(seq.slice(i*n, (i+1)*n)));
      scale = Math.min(scale, d3.min(area[i], function(d, j) { return area[i][j].y / gn[i][j]; }));
    }
    for(let i = 0; i < area.length; i++) {
      for(let j = i*n; j < (i+1)*n; j++) {
        seq[j].map(function(d, k) {
          d.y*=scale;
          if(j === i*n) d.y0 = area[i][k].y0 + (area[i][k].y - gn[i][k]*scale)/2;
          else  d.y0 = seq[j-1][k].y0 + seq[j-1][k].y;
        });
      }
    }
  }
  function filterInfFlow(d3, seq) {
    let n = 8;
    let m = 3;
    let newSeq = [];
    for(let i = 0; i < seq.length; i++) {
      newSeq.push([]);
      for(let j = 0; j < seq[i].length; j++) {
        newSeq[i].push({ x: seq[i][j].x, y: seq[i][j].y, y0: seq[i][j].y0 });
      }
    }
    for(let i = 0; i < seq.length; i+=n) {
      for(let j = 0; j < seq[i].length; j++) {
        let tmp = [];
        for(let k = 0; k < n; k++) tmp.push({ id: i+k, v: seq[i+k][j].y });
        tmp.sort(function(a, b) { return b.v - a.v; });
        // for(let k = 0; k < n; k++) if(k >= m) newSeq[tmp[k].id][j].y = 0;
        for(let k = 0; k < n; k++) if(k >= m) newSeq[i+k][j].y = 0;
      }
    }
    return newSeq;
  }
  function svgInteraction(d3, svg) {
    let drag = d3.behavior.drag();
    drag.on('drag', function() {
    });
  }
}());
