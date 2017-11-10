
var app = angular.module("myApp", ['ngPrettyJson']);


app.controller('index', function($scope ,$rootScope ,$http ,$location ,$window) {

    $scope.login = function (input) {
      // $scope.imLoading = true;
      $http({
       method: 'POST',
       url: "http://localhost:5000/drupal/login",
       data: { "name" : input.name, "password" : input.password, "url" : input.url },
       headers: {'Content-Type': 'application/json'}
       }).then(function(result) {
          console.log(result); 
          // $scope.imLoading = false;
          $rootScope.user_data = result.data.user_data;
          $window.sessionStorage['acct_id'] = result.data.acct_id;
          $window.sessionStorage['drupal_url'] = input.url;
          $window.sessionStorage['tm_dsn'] = input.dsn;
          $window.sessionStorage['tm_uid'] = input.uid;
          $window.sessionStorage['tm_sitename'] = input.sitename;
        }, function(error) {
           $scope.error = true;
       });             
     }

});

app.controller('drupal', function($scope ,$rootScope ,$http ,$location ,$window) {
  
  // List of Drupal Services
  $scope.drupal_services = [ 
        {Name:'User Details',endpoint:'login'},
        {Name:'User Events List',endpoint:'drupal/getRequest',api:'api/user-events/listing'},
        {Name:'User Events Summary',endpoint:'drupal/getRequest',api:'api/user-events/summary'},
        {Name:'Member List',endpoint:'drupal/getRequest',api:'api/member/list'},
        {Name:'User Ticket',endpoint:'drupal/getRequest',api:'api/user-ticket/1062'},//Dynamic
        {Name:'Invoice List',endpoint:'drupal/getRequest',api:'api/invoice/list'},
        {Name:'Invoice Details',endpoint:'drupal/getRequest',api:'api/invoice/3263/6'},//Dynamic
        {Name:'Payment Plans',endpoint:'drupal/getRequest',api:'api/invoice/plans'},
        {Name:'Plans For Invoice',endpoint:'drupal/getRequest',api:'api/invoice/plans/3263'},//Dynamic
        {Name:'Plan Details',endpoint:'drupal/getRequest',api:'api/invoice/plans/3263/18'},//Dynamic
        {Name:'CC Query',endpoint:'drupal/getRequest',api:'api/invoice/cc'},
    ];
    // Drupal getRequest CallBack
    $scope.hitDrupal = function(endpoint,api)
    {
      if (endpoint=='login') {
         $scope.drupal_output = $rootScope.user_data ? $rootScope.user_data : 'Please try Again';
      }
      else
      {
         $http({
           method: 'POST',
           url: "http://localhost:5000/"+endpoint,
           data: {"url":$window.sessionStorage["drupal_url"],"api":api},
           headers: {'Content-Type': 'application/json'}
           }).then(function(result) {
              console.log(result); 
              // $scope.imLoading = false;
             $scope.drupal_output = result.data;
            }, function(error) {
               $scope.drupal_output = 'Request Failed';
         });  
      }
    }

    // List of TM Services
    $scope.tm_services = [ 
        {Name:'User Details',endpoint:'login'},
        {Name:'Invoice List',endpoint:'tm/invoiceList'},
    ];
    $scope.hitTm = function(endpoint,api)
    {
    
       $http({
         method: 'POST',
         url: "http://localhost:5000/"+endpoint,
         data: {
                "dsn":$window.sessionStorage["tm_dsn"],
                "uid":$window.sessionStorage["tm_uid"],
                "sitename": $window.sessionStorage["tm_sitename"],
                "acct_id": $window.sessionStorage["acct_id"],
               },
         headers: {'Content-Type': 'application/json'}
         }).then(function(result) {
            console.log(result); 
            // $scope.imLoading = false;
           $scope.tm_output = result.data;
          }, function(error) {
             $scope.drupal_output = 'Request Failed';
       });  
      
    }


});



// app.factory('Scopes', function ($rootScope) {
//     var mem = {};
//  return {
//         store: function (key, value) {
//             $rootScope.$emit('scope.stored', key);
//             mem[key] = value;
//         },
//         get: function (key) {
//             return mem[key];
//         }
//     };
// });

