
var app = angular.module("myApp", ['ngPrettyJson', 'autoCompleteModule']);


app.controller('index', function($scope ,$rootScope ,$http ,$location ,$window) {
    $scope.login_button = "LogIn";
    if($window.sessionStorage['acct_id'])
    {
      $scope.login_button = "LogOut";
      $scope.acct_id = '#'+$window.sessionStorage['acct_id'];
    }
    if($window.sessionStorage['member_id'])
    {
      $scope.member_id = $window.sessionStorage['member_id'];
    }
    $scope.imLoading = false;
    $scope.read_only = false;

    $scope.loadconfig = function(url){
      $scope.imLoading = true;
      $http({
         method: 'POST',
         url: "http://localhost:5000/getConfig",
         data: { "url" : url },
         headers: {'Content-Type': 'application/json'}
         }).then(function(result) {

          $scope.input = result.data;
          $scope.imLoading = false;
         }, function(error) {
           $scope.imLoading = false;
       });
    }

    $scope.login = function(input) {
      
      $scope.imLoading = true;
      $http({
       method: 'POST',
       url: "http://localhost:5000/drupal/login",
       data: { "name" : input.name, "password" : input.password, "url" : input.url },
       headers: {'Content-Type': 'application/json'}
       }).then(function(result) {
          $scope.imLoading = false;
          $rootScope.user_data = result.data.user_data;
          $window.sessionStorage['drupal_url'] = input.url;
          $window.sessionStorage['acct_id'] = result.data.acct_id;
          $scope.acct_id = '#'+result.data.acct_id;
          
        }, function(error) {
           $scope.imLoading = false;
           $scope.error = true;
       });  

       $http({
         method: 'POST',
         url: "http://localhost:5000/saveConfig",
         data: { "url" : input.url, "dsn" : input.tm_dsn, "uid" : input.uid,
                 "sitename" : input.sitename,"accept" : input.accept,"contenttype" : input.contenttype, 
                 "acceptlanguage" : input.acceptlanguage,"xclient" : input.xclient,"xapikey" : input.xapikey,
                 "xosname" : input.xosname,"xosversion" : input.xosversion,
                 "clientid":input.clientid,"clientsecret":input.clientsecret,"oauthurl":input.oauthurl,"tmapiurl":input.tmapiurl,

               },
         headers: {'Content-Type': 'application/json'}
         }).then(function(result) {
          // $scope.imLoading = false;
          $window.sessionStorage['tm_dsn'] = input.dsn;
          $window.sessionStorage['tm_uid'] = input.uid;
          $window.sessionStorage['tm_sitename'] = input.sitename;
          $window.sessionStorage['tm_oauthurl'] = input.oauthurl;
          $window.sessionStorage['tm_tmapiurl'] = input.tmapiurl;
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
         method: 'POST',
         url: "http://localhost:5000/tm/login",
         data: { "name" : input.name, "password" : input.password, "oauthurl" : input.oauthurl,"clientid":input.clientid,"clientsecret":input.clientsecret },
         headers: {'Content-Type': 'application/json'}
         }).then(function(result) {
               $scope.imLoading = false;
            console.log(result); 
            $window.sessionStorage['tm_accesstoken'] = result.data.access_token;
            $window.sessionStorage['member_id'] = result.data.member_id;
            $rootScope.member_id = result.data.member_id;
          }, function(error) {
          $scope.imLoading = false;
       });
       $scope.login_button = "LogOut";
       $scope.read_only = true;
     }

});

app.controller('drupal', function($scope ,$rootScope ,$http ,$location ,$window, $q, $timeout) {
  // $window.sessionStorage["helper_data"] = '';
  $scope.drupal_progress = false;
  $scope.tm_progress = false;
  // List of Drupal Services
  $scope.drupal_services = [ 
        {Name:'User Details',endpoint:'login'},
        {Name:'User Events List',endpoint:'drupal/getRequest',api:'api/user-events/listing'},
        {Name:'User Events Summary',endpoint:'drupal/getRequest',api:'api/user-events/summary'},
        {Name:'Member List',endpoint:'drupal/getRequest',api:'api/member/list'},
        {Name:'User Ticket',endpoint:'drupal/getRequest',api:'api/user-ticket'},
        {Name:'Transfer Ticket Policy',endpoint:'drupal/getRequest',api:'api/transfer-ticket/policy'},
        {Name:'Ticket Transfer',endpoint:'drupal/ticketTransfer',api:'api/ticket/transfer'},
        {Name:'Ticket Reclaim',endpoint:'drupal/DELETE',api:'/api/ticket/multiple-reclaim'},
        {Name:'Invoice List',endpoint:'drupal/getRequest',api:'api/invoice/list'},
        {Name:'Invoice Details',endpoint:'drupal/getRequest',api:'api/invoice'},
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
      else if (Name == 'User Ticket' || Name == 'Transfer Ticket Policy') {
           hitDrupal_http_request(endpoint, 'api/user-events/listing', [1]);
           $scope.placeholder1 = "Event Id";
           $scope.goDynamic = function()
           {
              dynamic_api = api + '/' + $scope.drupDynam.one;
              hitDrupal_http_request(endpoint, dynamic_api); 
           }
      }
      else if(Name == 'Ticket Transfer')
      {
         hitDrupal_http_request(endpoint,'api/user-events/listing',[1]);
         $scope.placeholder1 = "Event Id";
         create_helper_response_two();
         $scope.placeholder2 = "Ticket Id";
         $scope.goDynamic = function()
           {
              hitDrupal_http_request(endpoint, api, [], [{'event':{'event_id':$scope.drupDynam.one } ,'is_display_price': 'true', 'ticket_ids':[$scope.drupDynam.two]}] ); 
           }
      }
      else if (Name == 'Invoice Details') {
           hitDrupal_http_request(endpoint,'api/invoice/list',[1,2]);
           $scope.placeholder1 = "Invoice Id";
           $scope.placeholder2 = "Inv Conf Id";
           $scope.goDynamic = function(dynamic)
           {
              dynamic_api = api + '/' + $scope.drupDynam.one + '/' + $scope.drupDynam.two;
              hitDrupal_http_request(endpoint, dynamic_api); 
           }
      }
      else if (Name == 'Plans For Invoice') {
           hitDrupal_http_request(endpoint,'api/invoice/list',[1]);
           $scope.placeholder1 = "Invoice Id";
           $scope.goDynamic = function(dynamic)
           {
              dynamic_api = api + '/' + $scope.drupDynam.one;
              hitDrupal_http_request(endpoint, dynamic_api); 
           }
      }
      else if (Name == 'Plan Details') {
           hitDrupal_http_request(endpoint,'api/invoice/list',[1,2]);
           $scope.placeholder1 = "Invoice Id";
           $scope.placeholder2 = "Plan Id";
           $scope.goDynamic = function(dynamic)
           {
              dynamic_api = api + '/' + $scope.drupDynam.one + '/' + $scope.drupDynam.two;
              hitDrupal_http_request(endpoint, dynamic_api); 
           }
      }
      else
      {
        hitDrupal_http_request(endpoint,api);
      }
    }

    function create_helper_response()
    {
               var resp_data = $window.sessionStorage["helper_data"].split(',');
               $scope.autoCompleteOptions = {
                  minimumChars: 0,
                  activateOnFocus: true,
                  data: function (term) {
                      term = term.toUpperCase();
                      return _.filter( resp_data, function (value) {
                          return value.startsWith(term);
                      });
                  }
               } 
               $scope.drupal_dynamic1 = true;
    }
     function create_helper_response_two()
    {
               var resp_data = $window.sessionStorage["helper_data_2"].split(',');
               $scope.autoCompleteOptions2 = {
                  minimumChars: 0,
                  activateOnFocus: true,
                  data: function (term) {
                      term = term.toUpperCase();
                      return _.filter( resp_data, function (value) {
                          return value.startsWith(term);
                      });
                  }
               } 
               $scope.drupal_dynamic2 = true;
    }

    function hitDrupal_http_request(endpoint, api, is_helper = null, post_data = null)
    {
       $scope.drupal_progress = true;
       $http({
             method: 'POST',
             url: "http://localhost:5000/"+endpoint,
             data: {"url":$window.sessionStorage["drupal_url"],"api":api,"helper":(is_helper !== null && is_helper[0] ? is_helper[0] : 0),"post_data":post_data},
             headers: {'Content-Type': 'application/json'}
             }).then(function(result) {
                console.log(result); 
                $scope.drupal_progress = false;
                if (is_helper !== null && is_helper[0]) 
                { 
                      if (result.data.invoiceconf) {
                        $window.sessionStorage["helper_data"] = result.data.invoiceid; 
                        $window.sessionStorage["helper_data_2"] = result.data.invoiceconf; 
                      }
                      else{
                       $window.sessionStorage["helper_data"] = result.data; 
                      }

                     create_helper_response();
                     if (is_helper[1] && is_helper[1] == 2) {
                      create_helper_response_two();
                     }
                }
                else 
                { 
                  $scope.drupal_output = result.data; 
                }
               },
               function(error) {
                 $scope.drupal_progress = false;
                 $scope.drupal_output = 'Request Failed';
           });  
    }
    





    // List of TM Services
    if ($window.sessionStorage['member_id']) {
      var  member_id = $window.sessionStorage['member_id'];
    }
    else
    {
      var member_id = $rootScope.member_id;
    }
    $scope.tm_services = [ 
        {Name:'User Details',endpoint:'login'},
        {Name:'Invoice List',endpoint:'tm/invoiceList'},
        {Name:'/member/<mem_id>/inventory/events',endpoint:'tm/memberRequest',api: "api/v1/member/"+member_id+"/inventory/events" },
        {Name:'/member/<mem_id>/inventory/event/<eventId>',endpoint:'tm/memberRequest',api:"api/v1/member/"+member_id+"/inventory/event/" },
        {Name:'/member/<mem_id>/inventory/search?event_id=<eventId>',endpoint:'tm/memberRequest',api:"api/v1/member/"+member_id+"/inventory/search?event_id=" },
        {Name:'/member/<mem_id>/transfer',endpoint:'tm/memberTicket',api:"api/v1/member/"+member_id+"/transfer" },
        {Name:'/members/<memb_id>/inventory/summary',endpoint:'tm/memberRequest',api:"api/v1/members/"+member_id+"/inventory/summary" },
        {Name:'/member/<mem_id>/',endpoint:'tm/memberRequest',api:"api/v1/member/"+member_id+"/" },
        {Name:'/member/<mem_id>/transfers',endpoint:'tm/memberRequest',api:"api/v1/member/"+member_id+"/transfers" },
        {Name:'/transfer/policy?event_id=<eventId>',endpoint:'tm/memberRequest',api:"api/v1/transfer/policy?event_id=" },
    ];

    $scope.hitTm = function(endpoint,api)
    {
        $scope.tmDynam ={ one:'',two:''};
        $scope.tm_dynamic1 = false;
        $scope.tm_dynamic2 = false;
        var tm_oauth_head = { 
                           'Accept':$window.sessionStorage['tm_accept'],
                           'Content-Type':$window.sessionStorage['tm_contenttype'],
                           'Accept-Language':$window.sessionStorage['tm_acceptlanguage'],
                           'X-Client':$window.sessionStorage['tm_xclient'],
                           'X-Api-Key':$window.sessionStorage['tm_xapikey'],
                           'X-OS-Name':$window.sessionStorage['tm_xosname'],
                           'X-OS-Version':$window.sessionStorage['tm_xosversion'],
                           'X-Auth-Token':$window.sessionStorage['tm_accesstoken'],
                       }; 
        var ats_head ={
                             "dsn":$window.sessionStorage["tm_dsn"],
                             "uid":$window.sessionStorage["tm_uid"],
                             "sitename": $window.sessionStorage["tm_sitename"],
                             "acct_id": $window.sessionStorage["acct_id"],
                            };               

       if ((api == "api/v1/member/"+member_id+'/inventory/event/') || (api == "api/v1/transfer/policy?event_id=") || (api == "api/v1/member/"+member_id+"/inventory/search?event_id=")) {
           
           hitTm_http_request(endpoint,"api/v1/member/"+member_id+'/inventory/events', tm_oauth_head, [1]);
           $scope.tmplaceholder1 = "Event Id";

           $scope.goDynamicTm = function()
           {
              dynamic_api = api  + $scope.tmDynam.one;
              hitTm_http_request(endpoint, dynamic_api, tm_oauth_head); 
           }                           
       }
       else if(api == 'api/v1/member/'+member_id+'/transfer')
       {
           hitTm_http_request('tm/memberRequest',"api/v1/member/"+member_id+'/inventory/events', tm_oauth_head, [1]);
           $scope.tmplaceholder1 = "Event Id";
           $scope.tm_dynamic2 = true;
           $scope.tmplaceholder2 = "Ticket Id";
           $scope.goDynamicTm = function()
           {
              transfer_data = {
                       'event':{'event_id':$scope.tmDynam.one} ,
                       'note':'yo yo honey singh',
                       'is_display_price': 'true',
                       'ticket_ids':[$scope.tmDynam.two]
                 };
              hitTm_http_request(endpoint, api, tm_oauth_head,[], transfer_data); 
           }
       }
       else{
         hitTm_http_request(endpoint, api, tm_oauth_head);
       }
    }
    
    function create_tmhelper_response()
    {
               var resp_data = $window.sessionStorage["tmhelper_data"].split(',');
               $scope.tmautoCompleteOptions = {
                  minimumChars: 0,
                  activateOnFocus: true,
                  data: function (term) {
                      term = term.toUpperCase();
                      return _.filter( resp_data, function (value) {
                          return value.startsWith(term);
                      });
                  }
               } 
               $scope.tm_dynamic1 = true;
    }

    function hitTm_http_request(endpoint = null, api = null, header_data = null, is_helper = null,post_data = null)
    {
       $scope.tm_progress = true;
       $http({
         method: 'POST',
         url: "http://localhost:5000/"+endpoint,
         data: {'headers':header_data, 'api':api, 'apiurl':$window.sessionStorage['tm_tmapiurl'], 'member_id':$window.sessionStorage['member_id'],"helper":(is_helper !== null && is_helper[0] ? is_helper[0] : 0),"post_data":post_data},
         headers: {'Content-Type': 'application/json'}
         }).then(function(result) {
             $scope.tm_progress = false;
             if (is_helper !== null && is_helper[0]) 
             { 
                      if (result.data.invoiceconf) {
                        $window.sessionStorage["tmhelper_data"] = result.data.invoiceid; 
                        $window.sessionStorage["tmhelper_data_2"] = result.data.invoiceconf; 
                      }
                      else{
                       $window.sessionStorage["tmhelper_data"] = result.data; 
                      }
                     create_tmhelper_response();
                     if (is_helper[1] && is_helper[1] == 2) {
                      create_tmhelper_response_two();
                     }
             }
            else 
            { 
             $scope.tm_output = result.data;
            } 
          }, function(error) {
             $scope.tm_progress = false;
             $scope.drupal_output = 'Request Failed';
       }); 
    }


});


