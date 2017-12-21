import requests
import time
import re
import json
import logging
import http.client as http_client
from flask_cors import CORS
from flask import Flask, request , jsonify
from pymongo import MongoClient
import pymongo


# Initialising Loaders
s = requests.Session()
app = Flask(__name__)
CORS(app)
pymongo_client = MongoClient('127.0.0.1',27017)
db = pymongo_client.testdb
collection  = db.test_collection


'''Requests Debug Logging Code '''
# http_client.HTTPConnection.debuglevel = 1
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



'''Returns Api parameters'''
@app.route('/getConfig',methods=['POST'])
def get_config():
  if request.method == 'POST':
    data = request.json
  try:
    lets_srch = collection.find_one({'url':data['url']})
  except pymongo.errors.InvalidOperation:
      pass   
  if lets_srch is not None:
    pop_id = lets_srch['_id']
    conv_toStr = str(pop_id)
    lets_srch['_id'] = conv_toStr
    return jsonify(lets_srch)
  else:
    return jsonify({'Mongo Status Get':'No data Found'})  



'''SAVES AND UPDATES Api parameters'''
@app.route('/saveConfig', methods=['POST'])
def save_config():
  if request.method == 'POST':
    data = request.json  
  mongo_error = ''
  lets_srch = collection.find_one({'url':data['url']})
  if lets_srch is None:  
    try:
      do_insert = collection.insert_one(data).inserted_id
    except (pymongo.errors.ConnectionFailure, pymongo.errors.InvalidOperation) as e:
      mongo_error = e  
    if do_insert is not None:
      return jsonify({'Mongo Status Save':'True'})
    else:
      return jsonify({'Mongo Status Save': mongo_error})      
  else:  
    try:
      do_update = collection.update({'url':data['url']}, {"$set":  data}, upsert=True, multi=True)
    except (pymongo.errors.ConnectionFailure, pymongo.errors.InvalidOperation) as e:
      mongo_error = e    
    if do_update['ok'] == 1:
      return jsonify({'Mongo Status Save':'True'})
    else:
      return jsonify({'Mongo Status Save': mongo_error})  



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
  if s.cookies:
    s.cookies.clear()
  '''Login Request'''
  try:
    login_url = data['url'] + 'user/login?_format=json&time='+str(curr_time)
    login_request = s.post(login_url,data=json.dumps(payload),headers=get_drupal_req_param(data['url'])['headers'])
    if login_request.status_code == 200:
      user_data = json.loads(login_request.text)
      acct_id = user_data['member_related_accounts'][0]['name']
      login_output = {'user_data':user_data,'acct_id':acct_id}
      return jsonify(login_output)
    else:
      error_json = {'Status Code':login_request.status_code, 'Message':login_request.text} 
      s.cookies.clear()
      s.close()
      return jsonify(error_json)
  except requests.exceptions.ConnectionError:  
    pass

      


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
      if data['helper'] == 1:
        helper_res = getHelperResponse(list_request.text, data['api'])
        return jsonify(helper_res)
      return jsonify({'status' : list_request.status_code,'output':json.loads(list_request.text),'requrl':request_url})
    else:
      error_json = {'status':list_request.status_code, 'output':list_request.text,'requrl':request_url}
      return jsonify(error_json)  
  except requests.exceptions.ConnectionError:  
    pass



'''Retursne Post Request Data'''
@app.route('/drupal/ticketTransfer',methods=['POST'])
def drupal_ticketTransfer():  
  if request.method == 'POST':
    data = request.json  
  try:
    curr_time = int(time.time())
    rest_token =  s.get(data['url'] + "rest/session/token" + "?_format=json&time="+str(curr_time), headers=get_drupal_req_param(data['url'])['headers']) 
    if rest_token.status_code == 200:
      d_headers = get_drupal_req_param("https://tm-am-qa.io-media.com/iomediaqaunitas/")['headers']
      d_headers['x-csrf-token'] = rest_token.text
      d_headers['content-type'] = 'application/json'
      request_url = data['url'] + data['api'] + "?_format=json&time="+str(curr_time)
      list_request = s.post(request_url, data=data['post_data'], headers=d_headers)
      if list_request.status_code in [200, 201, 204] :
        return list_request.text
    else:
      error_json = {'Status Code':list_request.status_code, 'Message':list_request.text}
      return jsonify(error_json)  
  except requests.exceptions.ConnectionError:  
    pass



'''Returns Helper Data Response'''
def getHelperResponse(response = None, api = None):
  if api == "api/user-events/listing":
    events = []
    for key in json.loads(response):
      events.append(key['event_id'])
    return events  
  elif api.find("/inventory/events") is not  -1:
    events = []
    if json.loads(response)['events'] is not None:
      for key in json.loads(response)['events']:
        events.append(key['event_id'])
      return events
  elif api == 'api/invoice/list':
    invoice_ids = []
    invoice_confids = []
    if json.loads(response)['data']:
      for key in json.loads(response)['data']:
        invoice_ids.append(key['invoice_ids'])  
        invoice_confids.append(key['inv_conf_id'])
      return {'invoiceid':invoice_ids,'invoiceconf':invoice_confids}  
  elif api == 'invoice_list':
    tminvoice_ids = []
    if json.loads(response)['command1']['invoices']:
      for key in json.loads(response)['command1']['invoices']:
        tminvoice_ids.append(key['invoice_ids'])  
      return tminvoice_ids
  return ''     




'''Returns Tm all helper reesponse'''
def get_tmall_helperresponse(url = None, req_headers = None): 
  if (url.find('/inventory/search?event_id')) != -1:
    resp = {}
    pos = url.find('search?')
    work_url = url[:pos] 
    try: 
      eurl = str(work_url+ 'events')
      events_data = s.get(eurl,headers=req_headers) 
      if json.loads(events_data.text)['events'] is not None:
        for key in json.loads(events_data.text)['events']:
          search_data = s.get(work_url+'search?event_id='+str(key['event_id']),headers = req_headers)
          data = json.loads(search_data.text)['inventory_items'][0]
          if data.get('event'):
            # if data['event']['can_transfer'] != False:
              if data.get('sections'):
                for section in data['sections']:
                  row = section['rows'][0]
                  if row.get('tickets'):
                    for ticket in row['tickets']:
                      if resp.get('transfer_ticket_id') == None:
                        if ticket['can_transfer'] != False:
                          resp['transfer_ticket_id'] =  ticket['ticket_id']
                          resp['transfer_event_id'] = key['event_id']
                          continue
                      if resp.get('posting_ticket_id') == None:    
                        if ticket['can_resale'] != False:
                          resp['posting_ticket_id'] = ticket['ticket_id']
                          resp['posting_event_id'] = key['event_id']
                          continue
                      if resp.get('render_ticket_id') == None:    
                        if ticket['can_render'] != False:
                          resp['render_ticket_id'] = ticket['ticket_id']
                      if resp.get('transfer_ticket_id') and resp.get('posting_ticket_id') and resp.get('render_ticket_id'):    
                        return resp
        return resp
    except requests.exceptions.ConnectionError:  
      pass       


# def get_ticket_id`                    




'''Returns Tm Invoice List'''
@app.route('/tm/invoiceList',methods=['POST'])
def tm_invoiceList():
  if request.method == 'POST':
    data = request.json  
  try:  
    invoiceList_request = s.post(get_tm_req_param(data['headers'],data['headers']['command1']['dsn'])['url'],data=json.dumps(data['headers']),headers= get_tm_req_param(data['headers'])['headers'],cert='live_tm_v2.pem')
    if invoiceList_request.status_code == 200:
      if data['helper'] == 1:
          helper_res = getHelperResponse(invoiceList_request.text, data['api'])
          return jsonify(helper_res)
      return jsonify({'Status':invoiceList_request.status_code,'tmall_api': data['api'],'requrl':get_tm_req_param(data['headers'],data['headers']['command1']['dsn'])['url'],'output':json.loads(invoiceList_request.text)})    
    else:
      error_json = {'Status':invoiceList_request.status_code,'tmall_api': data['api'], 'output':json.loads(invoiceList_request.text),'requrl':get_tm_req_param(data['headers'],data['headers']['command1']['dsn'])['url']}
      return jsonify(error_json)    
  except requests.exceptions.ConnectionError:  
    pass  



'''Returns Tm Response'''
@app.route('/tm/login',methods=['POST'])
def tm_login():
  if request.method == 'POST':
    data = request.json  
  paylod = {
        "client_id" : data['clientid'],
        "client_secret" : data['clientsecret'],
        "grant_type" : 'password',
        "username" : data['name'],
        "password" : data['password'],
      }
  req_url =  data['oauthurl']
  try:  
    oauth_request = s.post(req_url,data= paylod, headers= {'Content-Type':'application/x-www-form-urlencoded','Accept':'application/json'})
  except requests.exceptions.ConnectionError:  
    pass  
  if oauth_request.status_code == 200:
    access_token = json.loads(oauth_request.text)['access_token']
    if access_token:
      memId_url = req_url + str(access_token)
      memberid_request = s.get(memId_url)
      member_id = json.loads(memberid_request.text)['umember_token']
      oauth_data = {'access_token':access_token,'member_id':member_id}
      return jsonify(oauth_data)
  else:
    s.cookies.clear()
    s.close()    
    


'''Returns Member Events Response'''
@app.route('/tm/memberRequest',methods=['POST'])
def member_getRequest():
  tmall_helper_resp = {}
  if request.method == 'POST':
    data = request.json  
  req_headers = data['headers']
  try:  
    req_url = data['apiurl'] + data['api']
    make_request = s.get(req_url,headers=req_headers)  
  except requests.exceptions.ConnectionError:  
    pass  
  if make_request.status_code == 200:
     if data['tmall_helper'] == '1':
        tmall_helper_resp = get_tmall_helperresponse(req_url,req_headers)  
     if data['helper'] == 1:
        if make_request.text:     
          helper_res = getHelperResponse(make_request.text, data['api'])
          return jsonify(helper_res)
        else:
          return None  
     return jsonify({'Status':make_request.status_code,'requrl':req_url,'output':json.loads(make_request.text),'tmall_api': data['api'], 'tmall_helper_resp':tmall_helper_resp})
  else:
      error_json = {'Status':make_request.status_code, 'output':json.loads(make_request.text), 'requrl':req_url,'tmall_api': data['api']}
      return jsonify(error_json)    



'''Performs Ticket Send Operation'''
@app.route('/tm/transferTicket', methods=['POST'])
def member_postRequest():
  if request.method == 'POST':
    data = request.json  
  req_headers = data['headers']
  try:  
    req_url = data['apiurl'] + data['api']
    make_request = s.post(req_url,data = data['post_data'], headers=req_headers)
    if make_request.status_code in [200,201]:
      return  jsonify({'Status':make_request.status_code,'tmall_api': data['api'],'requrl':req_url,'output':json.loads(make_request.text),'post_data' : data['post_data']})
    else:
      error_json = {'Status':make_request.status_code, 'tmall_api': data['api'],'output':json.loads(make_request.text),'requrl':req_url,'post_data' : data['post_data']}
      return jsonify(error_json)   
  except requests.exceptions.ConnectionError:  
    pass    
    



'''Performs Ticket Delete Operation'''
@app.route('/tm/deleteTicket', methods=['POST'])
def member_deleteRequest():
  if request.method == 'POST':
    data = request.json  
  req_headers = data['headers']
  try:  
    req_url = data['apiurl'] + data['api']
    # req_headers['Cache-Control'] = 'no-cache'
    make_request = s.delete(req_url, headers=req_headers)
    if make_request.status_code in [200,201,204]:
      return  jsonify({'Status':make_request.status_code,'requrl':req_url,'tmall_api': data['api'],'output':json.loads(make_request.text)})
    else:
      error_json = {'Status':make_request.status_code, 'tmall_api': data['api'],'output':json.loads(make_request.text), 'requrl':req_url}
      return jsonify(error_json)   
  except requests.exceptions.ConnectionError:  
    pass     



@app.route('/logout')
def logout():
  s.cookies.clear()
  s.close()
  return jsonify({'Status':True})




if __name__ == '__main__':
    app.run(debug = True)




def member_getRequ():
  paylod = {  
        "client_id" : 'genesis.integration',
        "client_secret" : 'fcfys1-5RjQe--Bj6W5QmQ6xjKisdiBfSnerJeaAI9k',
        "grant_type" : 'password',
        "username" : 'tejpal@io-media.com',
        "password" : '123456',
      }
  req_url =  "https://app.ticketmaster.com/acctmgr-oauth-preprod/token/"
  try:  
    oauth_request = s.post(req_url,data= paylod, headers= {'Content-Type':'application/x-www-form-urlencoded','Accept':'application/json'})
    if oauth_request.status_code == 200:
      access_token = json.loads(oauth_request.text)['access_token']
      if access_token:
        memId_url = req_url + "/" + str(access_token)
        memberid_request = s.get(memId_url)
        member_id = json.loads(memberid_request.text)['umember_token']
        oauth_data = {'access_token':access_token,'member_id':member_id}
        print(oauth_data)
  except requests.exceptions.ConnectionError:  
    pass    
  req_headers = { 
                           'Accept':'application/vnd.amgr.v1.5+json',
                           'Content-Type':'application/json',
                           'Accept-Language':'en-us',
                           'X-Client':'genesis',
                           'X-Api-Key':'09f1949e-ef0f-11e6-80b7-0a1887e82b7a',
                           'X-OS-Name':'web',
                           'X-OS-Version':8,
                           'X-Auth-Token':access_token,
                       } 
  work_url = "https://staging-oss.ticketmaster.com/api/v1/member/"+str(member_id)+"/inventory/"
  try: 
    eurl = work_url + "events"
    events_data = s.get(eurl,headers=req_headers) 
    resp = {}
    if json.loads(events_data.text)['events'] is not None:
      for key in json.loads(events_data.text)['events']:
        search_data = s.get(work_url+'search?event_id='+str(key['event_id']),headers = req_headers)
        data = json.loads(search_data.text)['inventory_items'][0]
        if data.get('event'):
          # if data['event']['can_transfer'] != False:
            if data.get('sections'):
              for section in data['sections']:
                row = section['rows'][0]
                if row.get('tickets'):
                  for ticket in row['tickets']:
                    if resp.get('transfer_ticket_id') == None:
                      if ticket['can_transfer'] != False:
                        resp['transfer_ticket_id'] =  ticket['ticket_id']
                        resp['transfer_event_id'] = key['event_id']
                        continue
                    if resp.get('posting_ticket_id') == None:    
                      if ticket['can_resale'] != False:
                        resp['posting_ticket_id'] = ticket['ticket_id']
                        resp['posting_event_id'] = key['event_id']
                        continue
                    if resp.get('render_ticket_id') == None:    
                      if ticket['can_render'] != False:
                        resp['render_ticket_id'] = ticket['ticket_id']
                        resp['render_event_id'] = key['event_id']    
              print(resp)
  except :
    pass            
            

# member_getRequ()