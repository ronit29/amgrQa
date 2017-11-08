
var app = angular.module("myApp", ['ngRoute']);



app.config(function($routeProvider, $locationProvider) {

    $routeProvider
          .when('/details/:idx', {
            templateUrl: 'teamdetails.html' ,
            controller: 'details',
            hasPopUp : false,
            resolve: {
             auth: ["$q", "LoginService", function($q, LoginService) {
             
             var userInfo = LoginService.getUserInfo();            
             if (userInfo) {
             return $q.when(userInfo);
             } else {
             return $q.reject({ authenticated: false });
             }
             }]
            }
        })
      .otherwise({
            redirectTo: '/home'
        });
        // $locationProvider.html5Mode(true);
});

app.controller('index', function($scope ,$http ,$location ,$route, $rootScope, $window, LoginService) {
});

app.controller('details', function($scope, $location, $routeParams, $http) {

   var Lid = $routeParams.idx;
   for(var itr in $scope.teams)
   {
    if(Lid == $scope.teams[itr]['id'])
    {
        $scope.common = $scope.teams[itr];
    }
   }

   $scope.edit = function(id)
    {
      $location.path('/edit/' + id);
    };


   $scope.sth_loading = true;
   $scope.statusglyphi = false;
   $scope.sth = function(dsn,id)
   {
    $http({
      method: 'POST',
      url: "sth.php",
      data: { "dsn":dsn ,"id":id},
       headers: {'Content-Type': 'text/json; charset=utf-8','Authorization':'live_tm_v2.pem'}
       }).then(function(result) { 
          $scope.status_retrieved = true;
          $scope.sth_loading = false;
          $scope.statusglyphi = true;
          var sth_status = result.data.status;
          $scope.status = {};
          for (var i in sth_status)
          {
            $scope.status[i] = sth_status[i];
          }
       }, function(error) {
          $scope.sth_loading = false;
          $scope.statusglyphi = true;
          for(var i =0; i<4;i++)
          {
           $scope.status[i] = '';
          }
      });             
   };
   
    $scope.jqueryScrollbarOptions = {
        "onScroll":function(y, x){
            if(y.scroll == y.maxScroll){
                alert('Scrolled to bottom');
            }
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


