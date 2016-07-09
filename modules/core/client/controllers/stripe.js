(function (app) {
  'use strict';
  var influenceController = function($scope, DataManager, $timeout) {
    $scope.data = {};
    $scope.data.name = 'netease';
    $scope.data.server = 230;
    $scope.data.receive = 0;
    // $timeout(function(){
    //   DataManager.read($scope.data);
    // }, 2000);
    DataManager.read($scope.data);
  };
  angular.module('core')
    .controller('influenceCtrl', influenceController);

}(ApplicationConfiguration));
