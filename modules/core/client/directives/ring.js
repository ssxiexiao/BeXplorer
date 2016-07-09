(function() {
  'use strict';
  function Radio(d3, svg, conf, data) {
    this.d3 = d3;
    this.svg = svg;
    this.conf = conf;
    this.data = data;
  }
  angular
    .module('core')
    .directive('radioChart', function($window) {
      var link = function(scope, el, attr) {
        let d3 = $window.d3;
        let svg = d3.select(el[0]);
        let conf = { inner: 90, outer: 180, centerx: 200, centery: 200, color: '#ffaf56' };
        let data = d3.range(8).map(function(d) {
          return d3.range(4).map(function() { return parseInt(Math.random()*100); });
        });
        let radio = new Radio(d3, svg, conf, data);
        radio.render(radio.segement());
      };
      return {
        restrict: 'EA',
        template: '<svg width=400 height=400></svg>',
        replace: true,
        scope: {
        },
        link: link
      };
    });
  Radio.prototype.segement = function() {
    let self = this;
    let padAngle = 0.08;
    let pie = d3.layout.pie().sort(null).endAngle(2*Math.PI-(self.data.length*padAngle));
    let segement = pie(self.data.map(function(d) { return d3.sum(d); }));
    segement.map(function(d, i) {
      d.startAngle += i * padAngle;
      d.endAngle += i * padAngle;
    });
    console.log(segement);
    // return segement;
    let data_ = [];
    self.data.map(function(d, i) {
      let pie_ = d3.layout.pie()
        .startAngle(segement[i].startAngle)
        .endAngle(segement[i].endAngle)
        .sort(null);
      let tmp = pie_(d);
      data_ = data_.concat(tmp);
    });
    console.log(data_);
    return data_;
  }
  Radio.prototype.render = function(data) {
    let self = this;
    let conf = self.conf;
    let g = self.svg.append('g');
    let arc = d3.svg.arc();
    arc.innerRadius(conf.inner);
    arc.outerRadius(conf.outer);
    g.attr('transform', 'translate('+conf.centerx+','+conf.centery+')');
    g.selectAll('path')
      .data(data)
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', conf.color)
      .attr('fill-opacity', function(d, i) {
        return 1 - ((i)%4)*0.2;
      });
  };
}());
