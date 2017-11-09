
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
        {Name:'Invoice List',endpoint:'drupal/getRequest',api:'api/invoice/list'},
        {Name:'User Events List',endpoint:'drupal/getRequest',api:'api/user-events/listing'},
        {Name:'User Events Summary',endpoint:'drupal/getRequest',api:'api/user-events/summary'},
        {Name:'Member List',endpoint:'drupal/getRequest',api:'api/member/list'},
    ];
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


