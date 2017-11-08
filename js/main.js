
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
        }, function(error) {

          $scope.error = true;
       });             
     }

});

app.controller('drupal', function($scope ,$rootScope ,$http ,$location ,$window) {
  $scope.drupal_services = [ 
        {Name:'User Details',endpoint:'login'},
        {Name:'Invoice List',endpoint:'drupal/invoiceList'},
    ];

    $scope.hitDrupal = function(endpoint)
    {
      if (endpoint=='login') {
        // var jso = '{"label":{"plan_btn_lbl":"Plan","due_date_lbl":"Due Date","balance_lbl":"Balance Due","paid_btn_lbl":"Paid","date_format":"m/d/Y"},"data":[{"invoice_long_descriptions":"arch08 Invoice","invoice_descriptions":"arch08 Invoice","balances":"0.00","invoice_amounts":"1580.00","payment_plan_id":"25","current_due_amounts":"0.00","next_payment_amounts":"0.00","paid_amounts":"1580.00","overdue_amounts":"0.00","invoice_dates":"2017-03-22","invoice_ids":"3143","purchases":"1580.00","inv_conf_id":"4","date":"03/22/2017"},{"next_payment_amounts":"0.00","invoice_descriptions":"Arch07 Invoice","balances":"0.00","invoice_amounts":"2035.00","invoice_long_descriptions":"Arch07 Invoice","current_due_amounts":"0.00","due_dates":"2017-04-21","paid_amounts":"2035.00","overdue_amounts":"0.00","invoice_dates":"2017-03-22","invoice_ids":"3122","purchases":"2035.00","inv_conf_id":"4","date":"04/21/2017"},{"overdue_amounts":"0.00","invoice_descriptions":"Arch06 Invoice","current_due_amounts":"0.00","invoice_dates":"2017-03-21","next_payment_amounts":"95.91","paid_amounts":"1351.80","invoice_long_descriptions":"Arch06 Invoice","balances":"228.20","invoice_amounts":"1580.00","purchases":"1580.00","payment_plan_id":"27","due_dates":"2018-01-03","invoice_ids":"3116","inv_conf_id":"4","date":"01/03/2018"},{"next_payment_amounts":"0.00","invoice_descriptions":"Arch05 Renewal","balances":"0.00","invoice_amounts":"1975.00","invoice_long_descriptions":"Arch05 Renewal","current_due_amounts":"0.00","due_dates":"2017-04-20","paid_amounts":"1975.00","overdue_amounts":"0.00","invoice_dates":"2017-03-21","invoice_ids":"3097","purchases":"1975.00","inv_conf_id":"4","date":"04/20/2017"},{"next_payment_amounts":"0.00","invoice_descriptions":"Arch04 Renewal","balances":"0.00","invoice_amounts":"1580.00","invoice_long_descriptions":"Arch04 Renewal","current_due_amounts":"0.00","due_dates":"2017-04-20","paid_amounts":"1580.00","overdue_amounts":"0.00","invoice_dates":"2017-03-21","invoice_ids":"3082","purchases":"1580.00","inv_conf_id":"4","date":"04/20/2017"},{"next_payment_amounts":"0.00","invoice_descriptions":"Arch03 renewal","balances":"0.00","invoice_amounts":"1600.00","invoice_long_descriptions":"Arch03 renewal","current_due_amounts":"0.00","due_dates":"2017-04-20","paid_amounts":"1600.00","overdue_amounts":"0.00","invoice_dates":"2017-03-21","invoice_ids":"3068","purchases":"1600.00","inv_conf_id":"4","date":"04/20/2017"},{"overdue_amounts":"1852.25","invoice_descriptions":"Arch02 Invoice","current_due_amounts":"1852.25","invoice_dates":"2017-03-21","next_payment_amounts":"257.87","paid_amounts":"539.32","invoice_long_descriptions":"Arch02 Invoice","balances":"2650.68","invoice_amounts":"3190.00","purchases":"3190.00","payment_plan_id":"27","due_dates":"2017-05-03","invoice_ids":"3025","inv_conf_id":"4","date":"05/03/2017"},{"next_payment_amounts":"0.00","invoice_descriptions":"Test Renewal","balances":"0.00","invoice_amounts":"1620.00","invoice_long_descriptions":"Test Renewal","current_due_amounts":"0.00","due_dates":"2017-04-20","paid_amounts":"1620.00","overdue_amounts":"0.00","invoice_dates":"2017-03-21","invoice_ids":"3009","purchases":"1620.00","inv_conf_id":"4","date":"04/20/2017"}]}';
         $scope.drupal_output = $rootScope.user_data ? $rootScope.user_data : 'Please try Again';
         // $scope.drupal_output = jso ;
      }
      else
      {
         $http({
           method: 'POST',
           url: "http://localhost:5000/"+endpoint,
           data: {"url":$window.sessionStorage["drupal_url"]},
           headers: {'Content-Type': 'application/json'}
           }).then(function(result) {
              console.log(result); 
              // $scope.imLoading = false;
             $scope.drupal_output = result.data;
            }, function(error) {
               $scope.drupal_output = 'else';
         });  
         
      }
    }
});


app.factory("LoginService", function($http, $q, $window) {

   var userInfo;
   // var deferred = $q.defer();
     function login(user) {
      var deferred = $q.defer();
      $http({
       method: 'POST',
       url: "login.php",
       data: { "userName": user.name, "password": user.password, "type": 'db' },
       headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'}
       }).then(function(result) { 
       userInfo = {
        accessToken: result.data.login.token,
        userName: result.data.login.name
       };
       $window.sessionStorage["userInfo"] = JSON.stringify(userInfo);  
        deferred.resolve(userInfo);
        }, function(error) {
        deferred.reject(error);
       });      
       return deferred.promise;
       }


     function getUserInfo() {
     
      if ($window.sessionStorage["userInfo"]) {
          userInfo = JSON.parse($window.sessionStorage["userInfo"]);
        }
        return userInfo;
       }


     function logout() {
       $window.sessionStorage["userInfo"] = '';
       userInfo = null;
       window.location.reload();
       }

      return {
       login: login,
       getUserInfo: getUserInfo,
       logout: logout
      };  
  
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


