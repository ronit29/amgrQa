
var app = angular.module("myApp", ['ngPrettyJson']);


app.controller('index', function($scope ,$rootScope ,$http ,$location ,$window) {
    
    $scope.loadconfig = function(url){
      $http({
         method: 'POST',
         url: "http://localhost:5000/getConfig",
         data: { "url" : url },
         headers: {'Content-Type': 'application/json'}
         }).then(function(result) {

          $scope.input = result.data;
            // $scope.imLoading = false;
          }, function(error) {
       });
    }

    $scope.login = function (input) {
      
      // $scope.imLoading = true;
      // $http({
      //  method: 'POST',
      //  url: "http://localhost:5000/drupal/login",
      //  data: { "name" : input.name, "password" : input.password, "url" : input.url },
      //  headers: {'Content-Type': 'application/json'}
      //  }).then(function(result) {
      //     console.log(result); 
      //     // $scope.imLoading = false;
      //     $rootScope.user_data = result.data.user_data;
      //     $window.sessionStorage['acct_id'] = result.data.acct_id;
      //     $scope.acct_id = result.data.acct_id;
      //     
      //   }, function(error) {
      //      $scope.error = true;
      //  });  

       $http({
         method: 'POST',
         url: "http://localhost:5000/saveConfig",
         data: { "url" : input.url, "dsn" : input.dsn, "uid" : input.uid,
                 "sitename" : input.sitename,"accept" : input.accept,"contenttype" : input.contenttype, 
                 "acceptlanguage" : input.acceptlanguage,"xclient" : input.xclient,"xapikey" : input.xapikey,
                 "xosname" : input.xosname,"xosversion" : input.xosversion,
                 "clientid":input.clientid,"clientsecret":input.clientsecret,"oauthurl":input.oauthurl,

               },
         headers: {'Content-Type': 'application/json'}
         }).then(function(result) {
          // $scope.imLoading = false;
          console.log(result.data); 
          $window.sessionStorage['drupal_url'] = input.url;
          $window.sessionStorage['tm_dsn'] = input.dsn;
          $window.sessionStorage['tm_uid'] = input.uid;
          $window.sessionStorage['tm_sitename'] = input.sitename;
          $window.sessionStorage['tm_oauthurl'] = input.oauthurl;
          $window.sessionStorage['tm_clientsecret'] = input.clientsecret;
          $window.sessionStorage['tm_clientid'] = input.clientid;
          $window.sessionStorage['tm_xapikey'] = input.xapikey;
          $window.sessionStorage['tm_xosversion'] = input.xosversion;
          $window.sessionStorage['tm_xosname'] = input.xosname;
          $window.sessionStorage['tm_xclient'] = input.xclient;
          $window.sessionStorage['tm_acceptlanguage'] = input.acceptlanguage;
          $window.sessionStorage['tm_contenttype'] = input.contenttype;
          $window.sessionStorage['tm_accept'] = input.accept;
          
         },function(error) {
           $scope.error = true;
       });  

      
      $http({
         method: 'GET',
         url: "http://localhost:5000/tm/login",
         data: { "name" : input.name, "password" : input.password, "oauthurl" : input.oauthurl,"clientid":input.clientid,"clientsecret":input.clientsecret },
         headers: {'Content-Type': 'application/json'}
         }).then(function(result) {
            console.log(result); 
            // $scope.imLoading = false;
            $window.sessionStorage['tm_accesstoken'] = result.data.access_token;
            $window.sessionStorage['member_id'] = result.data.member_id;
          }, function(error) {
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
        {Name:'User Ticket',endpoint:'drupal/getRequest',api:'api/user-ticket'},//Dynamic
        {Name:'Transfer Ticket Policy',endpoint:'drupal/getRequest',api:'api/transfer-ticket/policy/1062'},//Dynamic
        {Name:'Rest Token',endpoint:'drupal/getRequest',api:'rest/session/token'},
        {Name:'Ticket Transfer',endpoint:'drupal/POST',api:'/api/ticket/transfer'},
        {Name:'Ticket Reclaim',endpoint:'drupal/DELETE',api:'/api/ticket/multiple-reclaim'},
        {Name:'Invoice List',endpoint:'drupal/getRequest',api:'api/invoice/list'},
        {Name:'Invoice Details',endpoint:'drupal/getRequest',api:'api/invoice'},//Dynamic
        {Name:'Payment Plans',endpoint:'drupal/getRequest',api:'api/invoice/plans'},
        {Name:'Plans For Invoice',endpoint:'drupal/getRequest',api:'api/invoice/plans'},//Dynamic
        {Name:'Plan Details',endpoint:'drupal/getRequest',api:'api/invoice/plans'},//Dynamic
        {Name:'CC Query',endpoint:'drupal/getRequest',api:'api/invoice/cc'},
    ];
    // Drupal getRequest CallBack
    $scope.hitDrupal = function(Name,endpoint,api)
    {
      $scope.drupDynam ={ one:'',two:''};
      $scope.drupal_dynamic1 = false;
      $scope.drupal_dynamic2 = false;
      if (endpoint=='login') {
         $scope.drupal_output = $rootScope.user_data ? $rootScope.user_data : 'Please try Again';
      }
      else if (Name == 'User Ticket') {
           $scope.drupal_dynamic1 = true;
           $scope.placeholder1 = "Event Id";
           $scope.goDynamic = function()
           {
              dynamic_api = api + '/' + $scope.drupDynam.one;
              console.log(dynamic_api);
              hitDrupal_http_request(endpoint, dynamic_api); 
           }
      }
      else if (Name == 'Invoice Details') {
           $scope.drupal_dynamic1 = true;
           $scope.drupal_dynamic2 = true;
           $scope.placeholder1 = "Invoice Id";
           $scope.placeholder2 = "Inv Conf Id";
           $scope.goDynamic = function(dynamic)
           {
              dynamic_api = api + '/' + dynamic.one + '/' + dynamic.two;
              hitDrupal_http_request(endpoint, dynamic_api); 
           }
      }
      else if (Name == 'Plans For Invoice') {
           $scope.drupal_dynamic1 = true;
           $scope.placeholder1 = "Invoice Id";
           $scope.goDynamic = function(dynamic)
           {
              dynamic_api = api + '/' + dynamic.one;
              hitDrupal_http_request(endpoint, dynamic_api); 
           }
      }
      else if (Name == 'Plan Details') {
           $scope.drupal_dynamic1 = true;
           $scope.drupal_dynamic2 = true;
           $scope.placeholder1 = "Invoice Id";
           $scope.placeholder2 = "Plan Id";
           $scope.goDynamic = function(dynamic)
           {
              dynamic_api = api + '/' + dynamic.one + '/' + dynamic.two;
              hitDrupal_http_request(endpoint, dynamic_api); 
           }
      }
      else
      {
        hitDrupal_http_request(endpoint,api);
      }
    }

    function hitDrupal_http_request(endpoint, api)
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



    // List of TM Services
    $scope.tm_services = [ 
        {Name:'User Details',endpoint:'login'},
        {Name:'Invoice List',endpoint:'tm/invoiceList'},
        {Name:'Events Inventory',endpoint:'tm/member',api: "/inventory/events" },
        {Name:'Event',endpoint:'tm/member',api:"/inventory/event/1062" },
        {Name:'Inventory Summary',endpoint:'tm/member',api:"/inventory/summary" },
        {Name:'Member Details',endpoint:'tm/member',api:"/" },
        {Name:'Ticket transfers',endpoint:'tm/member',api:"/transfers" },
        {Name:'Transfer Policy',endpoint:'tm/member',api:"/transfer/policy?event_id=1062" },
    ];

    $scope.hitTm = function(endpoint,api)
    {
       if (endpoint == 'tm/member') {
         var post_data = { 
                           'Accept':$window.sessionStorage['tm_accept'],
                           'Content-Type':$window.sessionStorage['tm_contenttype'],
                           'Accept-Language':$window.sessionStorage['tm_acceptlanguage'],
                           'X-Client':$window.sessionStorage['tm_xclient'],
                           'X-Api-Key':$window.sessionStorage['tm_xapikey'],
                           'X-OS-Name':$window.sessionStorage['tm_xosname'],
                           'X-OS-Version':$window.sessionStorage['tm_xosversion'],
                           'X-Auth-Token':$window.sessionStorage['tm_accesstoken'],
                         }; 
        hitTm_http_request(endpoint,api,post_data);                           

       }
       else{
         var post_data_ats ={
                             "dsn":$window.sessionStorage["tm_dsn"],
                             "uid":$window.sessionStorage["tm_uid"],
                             "sitename": $window.sessionStorage["tm_sitename"],
                             "acct_id": $window.sessionStorage["acct_id"],
                            };
       }
    }

    function hitTm_http_request(endpoint = null, api = null, post_data = null)
    {
       $http({
         method: 'POST',
         url: "http://localhost:5000/"+endpoint,
         data: {'headers':post_data, 'api':api, 'url':$window.sessionStorage['tm_oauthurl'],'member_id':$window.sessionStorage['member_id']},
         headers: {'Content-Type': 'application/json'}
         }).then(function(result) {
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


