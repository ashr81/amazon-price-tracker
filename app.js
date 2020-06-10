var request = require('request');
var pb = require('pushbullet');
var HTMLParser  = require('node-html-parser');

// Variables
var price = process.env.PURCHASE_PRICE,
	anr = process.env.AMAZON_RESOURCE_NAME,
	pb_token = process.env.PUSH_BULLET_API_TOKEN,
	check_interval = process.env.NOTIFICATION_INTERVAL_IN_MINUTES;
var amzn_url = `https://www.amazon.in/dp/${anr}`;
var span_id = '#priceblock_ourprice';
var check_interval = check_interval * 60*1000;

function checkPrice() {
	request(amzn_url, function(error, response, body) {
		if (!error && response.statusCode == 200) {
			var root = HTMLParser.parse(body);

			var list_price = root.querySelector(span_id);
			if(list_price) {
				list_price = list_price.text;
				console.log('Present price: '+list_price);
				var stripped_price = list_price.replace(/[,₹]+/g, '').trim()
				if (stripped_price <= price) {
					sendPush();
				}
			} else {
				sendOutofStock()
			}
		} else {
			console.log("Uh oh. There was an error.");
		}
	});

	setTimeout(checkPrice, check_interval);
}

checkPrice()

function sendOutofStock() {
	var pusher = new pb(pb_token);

	pusher.note(null, "Product still out of stock", "We are watching for changes in product.", function(error, response) {
		if(error) {
			console.log('some error occured:'+error);
		}
	});
}

function sendPush() {
	var pusher = new pb(pb_token);

	pusher.note(null, "Amazon Price Watch", "A product you are watching has dropped in price: " + amzn_url, function(error, response) {
		if (!error) {
			process.exit();
		}
	});
}
