import requests
import time
import json
import logging
import http.client as http_client
from flask_cors import CORS
from flask import Flask, request , jsonify

s = requests.Session()
app = Flask(__name__)
CORS(app)




'''Requests Debug Logging Code '''
# http_client.HTTPConnection.debuglevel = 1
# # You must initialize logging, otherwise you'll not see debug output.
# logging.basicConfig()
# logging.getLogger().setLevel(logging.DEBUG)
# requests_log = logging.getLogger("requests.packages.urllib3")
# requests_log.setLevel(logging.DEBUG)
# requests_log.propagate = True



'''Returns Drupal Request URL and Headers'''
def get_drupal_req_param(url):
  host_url = url.split('/')[2]
  head = {
          'Host':host_url,
          'User-Agent':'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:56.0) Gecko/20100101 Firefox/56.0'
         }
  # url = "https://tm-am-stg.io-media.com/genesis/"
  # url = "https://tm-am-qa.io-media.com/iomediaqaunitas/"
  params = {'headers':head}
  return params



'''Returns Ticketmaster Request URL and Headers'''
def get_tm_req_param(req_payload = None, dsn = None):
  tm_inv_head = {
      'Content-Type' : 'text/json; charset=utf-8',
      'Content-Length': len(json.dumps(req_payload)),
      'Connection' : 'Keep-Alive',
      'timeout' : 30,
    } 
  url = "https://ws.ticketmaster.com/archtics/ats/ticketing_services.aspx?dsn="+str(dsn)
  params = {'url':url,'headers':tm_inv_head}
  return params



'''Performs Drupal Login and Returns acct_id'''
@app.route('/drupal/login',methods=['POST'])
def drupal_login():
  if request.method == 'POST':
    data = request.json
  payload = {
              'name':data['name'],
              'pass':data['password'],
              'remember_me':0,
            }
  curr_time = int(time.time())  
  '''Login Request'''
  try:
    login_url = data['url'] + 'user/login?_format=json&time='+str(curr_time)
    login_request = s.post(login_url,data=json.dumps(payload),headers=get_drupal_req_param(data['url'])['headers'])
  except requests.exceptions.ConnectionError:  
    pass
  if login_request.status_code == 200:
    user_data = json.loads(login_request.text)
    acct_id = user_data['member_related_accounts'][0]['name']
    login_output = {'user_data':user_data,'acct_id':acct_id}
    return jsonify(login_output)
  else:
    error_json = {'Status Code':login_request.status_code, 'Message':login_request.text}  
    return jsonify(error_json)

      


'''Returns Invoice List'''
@app.route('/drupal/getRequest',methods=['POST'])
def drupal_getRequest():  
  if request.method == 'POST':
    data = request.json  
  try:
    curr_time = int(time.time())
    request_url = data['url'] + data['api'] + "?_format=json&time="+str(curr_time)
    list_request = s.get(request_url,headers=get_drupal_req_param(data['url'])['headers'])
    if list_request.status_code == 200:
      return list_request.text
    else:
      error_json = {'Status Code':list_request.status_code, 'Message':list_request.text}
      return jsonify(error_json)  
  except requests.exceptions.ConnectionError:  
    pass



'''Returns Tm Invoice List'''
@app.route('/tm/invoiceList',methods=['POST'])
def tm_invoiceList():
  if request.method == 'POST':
    data = request.json  
  inv_paylod = {
      "header" : {
        "ver":"0.9",
        "src_sys_type":"2",
        "src_sys_name":"IOMEDIA",
        # "archtics_version":"V605",
        "archtics_version":"V999",
      },
      "command1" : {
        "cmd" : 'invoice_list',
        "ref" : 'IOM_INVOICE_LIST',
        "uid" : data['uid'],
        "dsn" : data['dsn'],
        "site_name" : data['sitename'],
        'acct_id' : data['acct_id'],
      }
    }
  try:  
    invoiceList_request = s.post(get_tm_req_param(inv_paylod,data['dsn'])['url'],data=json.dumps(inv_paylod),headers= get_tm_req_param(inv_paylod)['headers'],cert='live_tm_v2.pem')
  except requests.exceptions.ConnectionError:  
    pass  
  return invoiceList_request.text



'''Returns Tm Response'''
# @app.route('/tm/login',methods=['POST'])
def tm_login():
  # if request.method == 'POST':
  #   data = request.json  
  paylod = {
        "client_id" : 'iomediaqaunitas.integration',
        "client_secret" : 'cAyPhupq0wFh_Qzgni1fsomi7xUwfvTwdHhvO8o4s74',
        "grant_type" : 'password',
        "username" : 'rkumar@io-media.com',
        "password" : '12345678',
      }
    
  try:  
    oauth_request = s.post("https://qa1-oauth.acctmgr.us-east-1.nonprod-tmaws.io/oauth/token",data=paylod,headers= {'Content-Type':'application/x-www-form-urlencoded','Accept':'application/json'})
  except requests.exceptions.ConnectionError:  
    pass  
  if oauth_request.status_code == 200:
    access_token = json.loads(oauth_request.text)['access_token']
    if access_token:
      memId_url = "https://qa1-oauth.acctmgr.us-east-1.nonprod-tmaws.io/oauth/token/" + str(access_token)
      memberid_request = s.get(memId_url)
      member_id = json.loads(memberid_request.text)['umember_token']
      oauth_data = {'access_token':access_token,'member_id':member_id}
      print(oauth_data)
      # return jsonify(oauth_data)
    '''Returns `   Response'''
# @app.route('/tm/login',methods=['POST'])
# def member_inventory():
  # if request.method == 'POST':
  #   data = request.json  
  req_headers = {
                  'Accept':'application/vnd.amgr.v1.5+json',
                  'Content-Type':'application/json',
                  'Accept-Language':'en-us',
                  'X-Client':'iomediaqaunitas',
                  'X-Api-Key':'6ca830a9-0aa2-11e7-bce4-0afa92bc63fa',
                  'X-OS-Name':'iOS',
                  'X-OS-Version':8,
                  'X-Auth-Token':access_token,
                  # 'member_id':member_id
                }   
  try:  
    # req_url = "https://qa1.acctmgr.us-east-1.nonprod-tmaws.io/api/v1/transfer"
    # /policy?event_id=1062"
    # req_url = "https://qa1.acctmgr.us-east-1.nonprod-tmaws.io/api/v1/member/"+str(member_id)+
    # "/inventory/event/1062"
    # /inventory/events
    # /inventory/summary
    # {member_id}
    # /transfers
    # request = s.get(req_url,headers=req_headers)
    # req_url = "https://qa1.acctmgr.us-east-1.nonprod-tmaws.io/api/v1/member/"+str(member_id)+"/transfer"
    # transfer_data = {
    #                   'event':{'event_id':1062} ,
    #                   'note':'yo yo honey singh',
    #                   'is_display_price': 'true',
    #                   'ticket_ids':["1062.236.Y.16"]
    #                 }
    # request = s.post(req_url, data=json.dumps(transfer_data), headers=req_headers)
    req_url = "https://qa1.acctmgr.us-east-1.nonprod-tmaws.io/api/v1/member/"+str(member_id)+"/transfer/b952b8e96d82cd621b6baf83d61783a2aps5a0d743ac28aa"
    req_headers['Cache-Control'] = 'no-cache'
    request = s.delete(req_url, headers=req_headers)
    print(request)
    print(request.text)
  except requests.exceptions.ConnectionError:  
    pass  
  if request.status_code == 200:
    print(request.text)
    








tm_login();
# if __name__ == '__main__':
#     app.run(debug = True)

