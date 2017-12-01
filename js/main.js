
var app = angular.module("myApp", ['ngPrettyJson', 'autoCompleteModule']);


app.controller('index', function($scope ,$rootScope ,$http ,$location ,$window) {
    $scope.login_button = "LogIn";
    $scope.disabled = true;
    if($window.sessionStorage['acct_id'] && (typeof $window.sessionStorage['acct_id'] !== 'undefined'))
    {
      $scope.login_button = "LogOut";
      $scope.acct_id = '#'+$window.sessionStorage['acct_id'];
    }
    if($window.sessionStorage['member_id'])
    {
      $scope.read_only = true;
      $scope.member_id = $window.sessionStorage['member_id'];
    }
    $scope.imLoading = false;
    $scope.read_only = false;
    $scope.tlogin_error = false;
    $scope.dlogin_error = false;

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
      if ($scope.login_button == "LogOut") {
        console.log('yes');
         $http({
           method: 'GET',
           url: "http://localhost:5000/logout",
           }).then(function(result) {
              sessionStorage.clear();
              $scope.imLoading = false;
              $scope.login_button = "LogIn";
              $scope.read_only = false;
              window.location.reload(true);
            }, function(error) {
               $scope.imLoading = false;
               $scope.error = true;
       });
      }
      else{
      $http({
       method: 'POST',
       url: "http://localhost:5000/drupal/login",
       data: { "name" : input.name, "password" : input.password, "url" : input.url },
       headers: {'Content-Type': 'application/json'}
       }).then(function(result) {
          $scope.imLoading = false;
          if (typeof result.data.acct_id !== 'undefined')
           { 
            $rootScope.user_data = result.data.user_data;
            $window.sessionStorage['drupal_url'] = input.url;
            $window.sessionStorage['acct_id'] = result.data.acct_id;
            $scope.acct_id = '#'+result.data.acct_id;
            $scope.login_button = "LogOut";
            $scope.read_only = true;
          }else{
           $scope.tlogin_error = true; 
          }
        }, function(error) {
           $scope.imLoading = false;
           $scope.dlogin_error = true;
       });  

       $http({
         method: 'POST',
         url: "http://localhost:5000/saveConfig",
         data: { "url" : input.url, "dsn" : input.dsn, "uid" : input.uid,
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
           // $scope.tlogin_error = true;
       });  

       
      $http({
         method: 'POST',
         url: "http://localhost:5000/tm/login",
         data: { "name" : input.name, "password" : input.password, "oauthurl" : input.oauthurl,"clientid":input.clientid,"clientsecret":input.clientsecret },
         headers: {'Content-Type': 'application/json'}
         }).then(function(result) {
            $scope.imLoading = false;
            if (result.data.access_token && ((typeof result.data.access_token !== 'undefined') || (result.data.access_token !== null))) {
              $window.sessionStorage['tm_accesstoken'] = result.data.access_token;
              $window.sessionStorage['member_id'] = result.data.member_id;
              $rootScope.member_id = result.data.member_id;
             }
             else{
                $scope.tlogin_error = true;
             } 
          },
          function(error) {
              $scope.imLoading = false;
              $scope.tlogin_error = true;
       });
      }
     }

});

app.controller('drupal', function($scope ,$rootScope ,$http ,$location ,$window, $timeout) {
  // $window.sessionStorage["helper_data"] = '';
  $scope.drupal_progress = false;
  $scope.tm_progress = false;
  $scope.drup_postrequest_disp = false;
  // List of Drupal Services
  $scope.drupal_services = [ 
        {Name:'User Details',endpoint:'login'},
        {Name:'api/user-events/listing',endpoint:'drupal/getRequest',api:'api/user-events/listing'},
        {Name:'api/user-events/summary',endpoint:'drupal/getRequest',api:'api/user-events/summary'},
        {Name:'api/member/list',endpoint:'drupal/getRequest',api:'api/member/list'},
        {Name:'api/user-ticket/<eventId>',endpoint:'drupal/getRequest',api:'api/user-ticket'},
        {Name:'api/transfer-ticket/policy/<eventId>',endpoint:'drupal/getRequest',api:'api/transfer-ticket/policy'},
        {Name:'api/ticket/transfer',endpoint:'drupal/ticketTransfer',api:'api/ticket/transfer'},
        {Name:'/api/ticket/multiple-reclaim',endpoint:'drupal/DELETE',api:'/api/ticket/multiple-reclaim'},
        {Name:'api/invoice/list',endpoint:'drupal/getRequest',api:'api/invoice/list'},
        {Name:'api/invoice/<invoiceId>/<confId>',endpoint:'drupal/getRequest',api:'api/invoice'},
        {Name:'api/invoice/plans',endpoint:'drupal/getRequest',api:'api/invoice/plans'},
        {Name:'api/invoice/plans/<invoiceId>',endpoint:'drupal/getRequest',api:'api/invoice/plans'},
        {Name:'api/invoice/plans/<invoiceId>/<planId>',endpoint:'drupal/getRequest',api:'api/invoice/plans'},
        {Name:'api/invoice/cc',endpoint:'drupal/getRequest',api:'api/invoice/cc'},
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
      else if (Name == 'api/user-ticket/<eventId>' || Name == 'api/transfer-ticket/policy/<eventId>') {
           hitDrupal_http_request(endpoint, 'api/user-events/listing', [1]);
           $scope.placeholder1 = "Event Id";
           $scope.goDynamic = function()
           {
              dynamic_api = api + '/' + $scope.drupDynam.one;
              hitDrupal_http_request(endpoint, dynamic_api); 
           }
      }
      else if(Name == 'api/ticket/transfer')
      {
         $scope.drup_postrequest = "{'event':{'event_id': 1062 } ,'is_display_price': 'true', 'ticket_ids':['1062.134.G.13']}"
         $scope.drup_postrequest_disp = true;
         $scope.goDynamic = function()
           {
              hitDrupal_http_request(endpoint, api, [], $scope.drup_postrequest ); 
           }
      }
      else if (Name == 'api/invoice/<invoiceId>/<confId>') {
           hitDrupal_http_request(endpoint,'api/invoice/list',[1,2]);
           $scope.placeholder1 = "Invoice Id";
           $scope.placeholder2 = "Inv Conf Id";
           $scope.goDynamic = function(dynamic)
           {
              dynamic_api = api + '/' + $scope.drupDynam.one + '/' + $scope.drupDynam.two;
              hitDrupal_http_request(endpoint, dynamic_api); 
           }
      }
      else if (Name == 'api/invoice/plans/<invoiceId>') {
           hitDrupal_http_request(endpoint,'api/invoice/list',[1]);
           $scope.placeholder1 = "Invoice Id";
           $scope.goDynamic = function(dynamic)
           {
              dynamic_api = api + '/' + $scope.drupDynam.one;
              hitDrupal_http_request(endpoint, dynamic_api); 
           }
      }
      else if (Name == 'api/invoice/plans/<invoiceId>/<planId>') {
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
  
    $scope.tm_services = [ 
        {Name:'User Details',endpoint:'login'},
        {Name:'/member/<mem_id>/inventory/events',endpoint:'tm/memberRequest',api:"/inventory/events" },
        {Name:'/member/<mem_id>/inventory/event/<eventId>',endpoint:'tm/memberRequest',api:"/inventory/event/" },
        {Name:'/member/<mem_id>/inventory/search?event_id=<eventId>',endpoint:'tm/memberRequest',api:"/inventory/search?event_id=" },
        {Name:'/member/<mem_id>/posting/profile',endpoint:'tm/memberRequest',api:"/posting/profile" },
        {Name:'/member/<mem_id>/postings',endpoint:'tm/memberRequest',api:"/postings" },
        {Name:'/member/<mem_id>/posting',endpoint:'tm/transferTicket',api:"/posting" },
        {Name:'/member/<mem_id>/transfer',endpoint:'tm/transferTicket',api:"/transfer" },
        {Name:'/member/<mem_id>/transfer/<transferId>',endpoint:'tm/deleteTicket',api:"/transfer/" },
        {Name:'/member/<mem_id>/posting/<postingId>',endpoint:'tm/deleteTicket',api:"/posting/" },
        {Name:'/members/<memb_id>/inventory/summary',endpoint:'tm/memberRequest',api:"/inventory/summary" },
        {Name:'/member/<mem_id>/',endpoint:'tm/memberRequest',api:"/" },
        {Name:'/member/<mem_id>/transfers',endpoint:'tm/memberRequest',api:"/transfers" },
        {Name:'/transfer/policy?event_id=<eventId>',endpoint:'tm/memberRequest',api:"api/v1/transfer/policy?event_id=" },
        {Name:'/invoice/list',endpoint:'tm/invoiceList',api:"invoice_list" },
        {Name:'/invoice/details',endpoint:'tm/invoiceList',api:"invoice_details" },
    ];

    $scope.hitTm = function(endpoint,api)
    {
        if ($window.sessionStorage['member_id']) {
          var  member_id = $window.sessionStorage['member_id'];
        }
        else
        {
          var member_id = $rootScope.member_id;
        }     
        $scope.tmDynam ={ one:'',two:''};
        $scope.tm_dynamic1 = false;
        $scope.tm_dynamic2 = false;
        $scope.postrequest_disp  = false;
        var tm_api = ''
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
        var inv_paylod = {
            "header" : {
              "ver":"0.9",
              "src_sys_type":"2",
              "src_sys_name":"IOMEDIA",
              // "archtics_version":"V605",
              "archtics_version":"V999",
            },
            "command1" : {
              "cmd" : 'invoice_list',
              "ref" : 'IOM_INVOICE_LIST',
              "uid" : $window.sessionStorage["tm_uid"],
              "dsn" : $window.sessionStorage["tm_dsn"],
              "site_name" : $window.sessionStorage["tm_sitename"],
              'acct_id' : $window.sessionStorage["acct_id"],
            }
        }

       if (api == "/inventory/summary") {
        tm_api =  "api/v1/members/"+member_id+ api;
       }    
       else if(api == "api/v1/transfer/policy?event_id="){
        tm_api = api;
       }                 
       else{
         tm_api =  "api/v1/member/"+member_id+ api;
       }



       if ((api == '/inventory/event/') || (api == "api/v1/transfer/policy?event_id=") || (api == "/inventory/search?event_id=")) {
           
           hitTm_http_request(endpoint,"api/v1/member/"+member_id+'/inventory/events', tm_oauth_head, [1]);
           $scope.tmplaceholder1 = "Event Id";

           $scope.goDynamicTm = function()
           {
              dynamic_api = tm_api  + $scope.tmDynam.one;
              hitTm_http_request(endpoint, dynamic_api, tm_oauth_head); 
           }                           
       }
       else if(api == '/transfer' && endpoint == 'tm/transferTicket')
       {
           // hitTm_http_request('tm/memberRequest',"api/v1/member/"+member_id+'/inventory/events', tm_oauth_head, [1]);
           $scope.postrequest = '{"event":{"event_id": 1062} ,"note":"yo yo honey singh", "is_display_price": "true", "ticket_ids":["1062.113.Y.11"] }';
           $scope.postrequest_disp = true;
           $scope.goDynamicTm = function()
           {             

              hitTm_http_request(endpoint, tm_api, tm_oauth_head, [], $scope.postrequest); 
           }
       }
       else if(api == '/posting' && endpoint == 'tm/transferTicket')
       {
           $scope.postrequest = '{"payout_method":"account_credit","expiration_offset":-1440,   "is_allow_splits":false, "pricing_model":"fixed",   "event":{        "event_id":"1065"   },   "payout_price":{        "currency":"USD",      "value":4500   },   "seat_descriptions":[        {           "description":"End Zone seats",         "required":false      }   ],   "sections":[        {           "section_name":"110",         "rows":[              {                 "row_name":"B",               "tickets":[                    {                       "ticket_id":"1065.110.B.2"                  }               ]            }         ]      }   ]}';
           $scope.postrequest_disp = true;
           $scope.goDynamicTm = function()
           {             
              hitTm_http_request(endpoint, tm_api, tm_oauth_head, [], $scope.postrequest); 
           }   
       }
       else if((api == '/transfer/' && endpoint == 'tm/deleteTicket') || ((api == '/posting/' && endpoint == 'tm/deleteTicket'))){
           $scope.tmplaceholder1 = "transfer Id";
           $scope.tm_dynamic1 = true;
           $scope.goDynamicTm = function()
           {
              dynamic_api = tm_api  + $scope.tmDynam.one;
              hitTm_http_request(endpoint, dynamic_api, tm_oauth_head); 
           }  
       }
       else if(endpoint == "tm/invoiceList"){
         if(api == 'invoice_list'){
           inv_paylod['command1']['cmd'] = api;
           inv_paylod['command1']['ref'] = "IOM_"+api.toUpperCase();
           hitTm_http_request(endpoint, api, inv_paylod);
         }
         if(api == "invoice_details") {
           var helper_paylod = inv_paylod;
           helper_paylod['command1']['cmd'] = 'invoice_list';
           helper_paylod['command1']['ref'] = "IOM_INVOICE_LIST";
           hitTm_http_request(endpoint, 'invoice_list', helper_paylod,[1]);
           $scope.tmplaceholder1 = "Invoice Id";
           $scope.goDynamicTm = function()
           {  
              inv_paylod['command1']['invoice_id'] = $scope.tmDynam.one;           
              hitTm_http_request(endpoint, api, inv_paylod); 
           }  
         }
       }
       else{
         hitTm_http_request(endpoint, tm_api, tm_oauth_head);
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
             $scope.tm_output = 'Request Failed';
       }); 
    }


});


