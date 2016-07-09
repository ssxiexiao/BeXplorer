(function() {
  'use strict';
  angular
    .module('core')
    .factory('DataManager', DataManager);
  function DataManager($http) {
    var service = {
      read: read
    };
    return service;
    function read(fd) {
      $http
        .get('/data/consumeList.json')
        .success(function(data) {
          console.info('consumption ready');
          fd.consumption = data;
          fd.receive++;
        });
      $http
        .get('/data/influence.json')
        .success(function(data) {
          console.info('influence ready');
          fd.influence = data;
          fd.receive++;
        });
    }
  }
}());
