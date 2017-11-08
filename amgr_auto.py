import requests
import time
import json
import logging
import http.client as http_client
from flask import Flask, request , jsonify

s = requests.Session()
acct_id = 0
app = Flask(__name__)




'''Requests Debug Logging Code '''
# http_client.HTTPConnection.debuglevel = 1
# You must initialize logging, otherwise you'll not see debug output.
# logging.basicConfig()
# logging.getLogger().setLevel(logging.DEBUG)
# requests_log = logging.getLogger("requests.packages.urllib3")
# requests_log.setLevel(logging.DEBUG)
# requests_log.propagate = True



# 'Host':'tm-am-stg.io-media.com',
'''Returns Drupal Request URL and Headers'''
def get_drupal_req_param():
  head = {
          'Host':'tm-am-qa.io-media.com',
          'User-Agent':'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:56.0) Gecko/20100101 Firefox/56.0'
         }
  # url = "https://tm-am-stg.io-media.com/genesis/"
  url = "https://tm-am-qa.io-media.com/iomediaqaunitas/"
  params = {'url':url,'headers':head}
  return params



'''Returns Ticketmaster Request URL and Headers'''
def get_tm_req_param(req_payload = None):
  tm_inv_head = {
      'Content-Type' : 'text/json; charset=utf-8',
      'Content-Length': len(json.dumps(req_payload)),
      'Connection' : 'Keep-Alive',
      'timeout' : 30,
    } 
  url = "https://ws.ticketmaster.com/archtics/ats/ticketing_services.aspx?dsn=unitas"    
  params = {'url':url,'headers':tm_inv_head}
  return params



'''Performs Drupal Login and Returns acct_id'''
@app.route('/login',methods=['POST'])
def drupal_login():
  if request.method == 'POST':
    data = request.form['name'] 
  return data
  username = 'rkumar@io-media.com'
  password = '12345678'
  payload = {
              'name':username,
              'pass':password,
              'remember_me':0,
            }
  curr_time = int(time.time())  
  '''Login Request'''
  try:
    login_url = get_drupal_req_param()['url'] + 'user/login?_format=json&time='+str(curr_time)
    login_request = s.post(login_url,data=json.dumps(payload),headers=get_drupal_req_param()['headers'])
  except requests.exceptions.ConnectionError:  
    pass
  if login_request.status_code == 200:
    user_data = json.loads(login_request.text)
    acct_id = user_data['member_related_accounts'][0]['name']
    # login_cookies = s.cookies
    return acct_id

      


'''Returns Invoice List'''
def drupal_invoiceList():  
  '''Invoice List Request'''  
  try:
    invoiceList_url = get_drupal_req_param()['url'] + "api/invoice/list?_format=json&time=1509821221778"
    list_request = s.get(invoiceList_url,headers=get_drupal_req_param()['headers'])
    return json.loads(list_request.text)
  except requests.exceptions.ConnectionError:  
    pass
    


'''Returns Tm Invoice List'''
@app.route('/tm')
def tm_invoiceList():
  # acctid = acct_id if acct_id is not 0 else drupal_login()
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
        # "uid" : 'iomed05',
        "uid" : 'INET01',
        "dsn" : 'unitas',
        "site_name" : 'unitas',
        'acct_id' : 293886,
      }
    }
  try:  
    invoiceList_request = s.post(get_tm_req_param()['url'],data=json.dumps(inv_paylod),headers= get_tm_req_param(inv_paylod)['headers'],cert='live_tm_v2.pem')
  except requests.exceptions.ConnectionError:  
    pass  
  return jsonify(invoiceList_request.text)  

if __name__ == '__main__':
   app.run(debug = True)
