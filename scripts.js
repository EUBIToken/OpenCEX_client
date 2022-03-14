"use strict";
let _main = async function(){
	const useDevServer = localStorage.getItem("OpenCEX_devserver") !== null;
	
	let tempfunc;
	{
		const map = {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
			"'": '&#039;'
		};
		tempfunc = function(text) {
			return text.replace(/[&<>"']/g, function(m) { return map[m]; });
		};
	}

	const escapeHTML = tempfunc;
	
	{
		tempfunc = function(text) {
			const map = {
				'"': '\\";',
				'\\': '\\\\',
				'\/': '\\/',
				'\b': '\\b',
				'\f': '\\f;',
				'\n': '\\n',
				'\r': '\\r',
				'\t': '\\t',


			};
			return text.replace(/[\"\\\/\b\f\n\r\t]/g, function(m) { return map[m]; });
		};
	}

	const escapeJSON = tempfunc;
	{
		const domcache = [];
		tempfunc = function(elem) {
			if(domcache[elem]){
				return domcache[elem];
			} else{
				const temp = document.getElementById(elem);
				domcache[elem] = temp;
				return temp;
			}
		};
	}
	const smartGetElementById = tempfunc;
	tempfunc = undefined;
	smartGetElementById("devserverstatus").style.display = (useDevServer ? "list-item" : "none");
	
	const toast = async function(text){
		M.toast({html: text});
	};
	
	const prepxhtp = function(){
		const xhttp = new XMLHttpRequest();
		xhttp.open("POST", useDevServer ? "https://opencex-dev.polyeubitoken.com" : "https://opencex-prod.polyeubitoken.com", true);
		xhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		xhttp.addEventListener('error', async function(){
			toast("Server connection failed!");
		});
		xhttp.withCredentials = true;
		return xhttp;
	};
	
	//BEGIN DOM BINDINGS
	let callIfExists = async function(elem, func){
		const temp = smartGetElementById(elem);
		if(temp){
			func(temp);
		}
	};
	let bindIfExists = async function(elem, func){
		callIfExists(elem, async function(e2){
			e2.onclick = func;
		});
	};
	
	const bindResponseValidatorAndCall = async function(data, callback){
		const xhttp = prepxhtp();
		xhttp.addEventListener('load', async function(){
			let decoded_list = undefined;
			try{
				decoded_list = JSON.parse(this.responseText);
			} catch{

			}
			
			if(decoded_list){
				if(decoded_list.returns){
					callback(decoded_list.returns);
				} else{
					if(decoded_list.reason){
						toast("Server returned error: " + escapeHTML(decoded_list.reason));
					} else{
						toast("Server returned unknown error!");
					}
				}
			} else{
				toast("Server returned invalid data!");
			}
		});
		
		xhttp.send(data);
	};
	
	bindIfExists("requestShitcoinButton", async function(){
		bindResponseValidatorAndCall("OpenCEX_request_body=%5B%7B%22method%22%3A%20%22get_test_tokens%22%7D%5D", async function(){
			toast("Operation completed successfully! reloading...");
			document.location.href = document.location.href;
		});		
	});
	
	let freeWeb3Counter = 0;
	const tryFreeWeb3 = async function(){
		if(++freeWeb3Counter == 2){
			Web3 = undefined;
		}
	};
	
	callIfExists("has_preloads", async function(){
		const registeredPreloads = [];
		const registeredPreloadFormatters = [];
		const preloadIfExists = async function(name, formatter = escapeHTML){
			callIfExists("preloaded_" + name, async function(){
				registeredPreloads.push({method: name});
				registeredPreloadFormatters.push(formatter);
			});
		};
		
		preloadIfExists("client_name", function(e){
			return ["Hi, ", escapeHTML(e), "!"].join("");
		});
		
		preloadIfExists("eth_deposit_address", function(e){
			const data = ["0xe8aaeb54", (useDevServer ? "000000000000000000000000a2d1d9e473f010bb62591ff38ca45dd16b279195" : "0000000000000000000000008bca715a0744801bcc5c0ce203b9d1fad84b4641"), "000000000000000000000000", e.substring(2)].join("");
			(new Web3.modules.Eth("https://polygon-rpc.com")).call({
				from: "0x0000000000000000000000000000000000000000",
				to: "0xed91faa6EFa532B40F6A1BFF3caB29260ebabd21",
				data: data
			}, "latest", async function(error, value){
				if(value){
					smartGetElementById("polygon_erc20_deposit_address").innerHTML = ["Please send funds to this deposit address: 0x", escapeHTML(value.substring(26)), "!"].join("");
				} else{
					toast("unable to fetch Polygon ERC20 deposit address!");
				}
				
			});
			(new Web3.modules.Eth("https://node1.mintme.com:443")).call({
				from: "0x0000000000000000000000000000000000000000",
				to: "0x9f46db28f5d7ef3c5b8f03f19eea5b7aa8621349",
				data: data
			}, "latest", async function(error, value){
				if(value){
					smartGetElementById("mintme_erc20_deposit_address").innerHTML = ["Please send funds to this deposit address: 0x", escapeHTML(value.substring(26)), "!"].join("");
				} else{
					toast("unable to fetch MintME ERC20 deposit address!");
				}
			});
			tryFreeWeb3();
			
			return ["Please send funds to this deposit address: ", escapeHTML(e), "!"].join("");
		});
		
		if(registeredPreloads.length != 0){
			//preload everything
			bindResponseValidatorAndCall("OpenCEX_request_body=" + encodeURIComponent(JSON.stringify(registeredPreloads)), async function(decoded_list){
				for(let i = 0; i < registeredPreloads.length; i++){
					smartGetElementById("preloaded_" + registeredPreloads[i].method).innerHTML = registeredPreloadFormatters[i](decoded_list[i]);
				}
			});

		}
	});
	
	//BEGIN ACCOUNT MANAGEMENT FUNCTIONS
	{
		const registerOrLogin = async function(register){
			const password = smartGetElementById("password").value;
			let method = "login";
			let renemberExtras = "";
			if(register){
				method = "create_account";
				if(password != smartGetElementById("password2").value){
					toast("Passwords do not match!");
					return;
				}
			} else{
				renemberExtras = smartGetElementById("renemberme").value ? ', "renember": true' : ', "renember": false';
			}
			const captcha = document.getElementsByName('rain-captcha-response')[0].value;
			if(captcha == ""){
				toast("Please solve the captcha!");
				return;
			}
			
			const xhttp = prepxhtp();
			xhttp.addEventListener('load', async function(){
				let decoded_list = undefined;
				try{
					decoded_list = JSON.parse(this.responseText);
				} catch{

				}
				
				if(decoded_list){
					if(decoded_list.returns){
						toast("Operation completed successfully! redirecting to client area...");
						document.location.href = "clientarea.html";
					} else{
						if(decoded_list.reason){
							toast("Server returned error: " + escapeHTML(decoded_list.reason));
							return;
						} else{
							toast("Server returned unknown error!");
							return;
						}
					}
				} else{
					toast("Server returned invalid data!");
					return;
				}
			});
			
			xhttp.send("OpenCEX_request_body=" + encodeURIComponent(['[{"method": "', method, '", "data": {"captcha": "', escapeJSON(captcha), '", "username": "', escapeJSON(smartGetElementById("username").value), '", "password" : "', escapeJSON(password), '"', renemberExtras + '}}]'].join("")));
		};
		
		bindIfExists("accountRegistrationButton", async function(){
			registerOrLogin(true);
		});
		
		bindIfExists("loginButton", async function(){
			registerOrLogin(false);
		});
		
		bindIfExists("logoutButton", async function(){
			const xhttp = prepxhtp();
			xhttp.addEventListener('load', async function(){
				let decoded_list = undefined;
				try{
					decoded_list = JSON.parse(this.responseText);
				} catch{

				}
				
				if(decoded_list){
					if(decoded_list.returns){
						toast("Operation completed successfully! redirecting to home page...");
						document.location.href = "index.html";
					} else{
						//Alternate logout only destroys the session cookie on the client side, if the server
						//is malfunctioning. It is used if the server is not working properly.
						toast("Server returned error, attempting alternate logout...");
						const logout = new XMLHttpRequest();
						logout.open("POST", "quick_destroy_session.php", true);
						logout.addEventListener('load', async function(){
							toast("Operation completed successfully! redirecting to home page...");
							document.location.href = "index.html";
						});
						logout.addEventListener('error', async function(){
							toast("Alternate logout failed, please clear your cookies!");
						});
						logout.send();
					}
				} else{
					toast("Server returned invalid data!");
					return;
				}
			});
			
			xhttp.send('OpenCEX_request_body=%5B%7B%22method%22%3A%20%22logout%22%7D%5D');
		});
	}	
	//END ACCOUNT MANAGEMENT FUNCTIONS
	
	const get_conv = function(temp){
		switch(temp){
			case "EUBI":
			case "1000x":
				return "szabo";
			default:
				return "ether";
		}
	};
	
	//BEGIN TRADING FUNCTIONS
	
	callIfExists("trading_room", async function(){
		//Unload unused Web3 modules
		const copied_web3_conv2wei = Web3.utils.toWei;
		const copied_web3_conv2dec = Web3.utils.fromWei;
		const BigInt = Web3.utils.BN;
		Web3 = undefined;
		
		let selected_pri = "MintME";
		let selected_sec = "PolyEUBI";
		let chartLabel = "MintME/PolyEUBI";
		let barData = [];
		let primary_converter = "ether";
		let _updateChartIMPL;
		{
			//Setup trading chart
			const ctx = document.getElementById('tradingchart').getContext('2d');

			Chart.defaults.color = "#FFFFFF";
			const chart = new Chart(ctx, {
				type: 'candlestick',
				data: {
					datasets: [{
						label: chartLabel,
						data: barData,
						type: 'candlestick',
						color: {
							up: '#00FF00',
							down: '#FF0000',
							unchanged: '#FFFFFF',
						},
						borderColor: {
							up: '#FFFFFF',
							down: '#FFFFFF',
							unchanged: '#FFFFFF',
						}
						
					}]
				}
			});
			chart.config.options.scales.y.type = 'linear';

			_updateChartIMPL = async function() {
				chart.config.data.datasets = [
					{
						label: chartLabel,
						data: barData
					}	
				];
				chart.update();
			};
			
		}
		const updateChartIMPL = _updateChartIMPL;
		_updateChartIMPL = undefined;
		
		const reloadChartsFromServer = async function(){
			const template = ['{"method": "', "get_chart", '", "data": {"primary": "', escapeJSON(selected_pri), '", "secondary": "', escapeJSON(selected_sec), '"}}'];
			const builder = ['[', ...template, ", "];
			
			template[1] = "bid_ask";
			builder.push(...template, "]");
			bindResponseValidatorAndCall('OpenCEX_request_body=' + encodeURIComponent(builder.join("")), async function(data){
				//Update chart
				chartLabel = [selected_pri, selected_sec].join("/");
				let cdata = data[0];
				if(cdata.length != 0){
					
					//Fix missing trading sessions
					if(true){
						const cdata2 = [cdata[0]];
						let prev = cdata[0];
						const span = new BigInt('86400');
						for(let i = 1; (i < cdata.length) && (cdata2.length < 60); i++){
							const prevtime = new BigInt(prev.x.toString());
							const distance = parseInt((new BigInt(cdata[i].x)).sub(prevtime).div(span).toString());toast('3');
							for(let c = 0; c < distance && cdata2.length < 60; ){
								cdata2.push({x: prevtime.add((new BigInt((++c).toString()))).mul(span).toString(), o: prev.c, h: prev.c, l: prev.c, c: prev.c});
							}
							prev = cdata[i];
							console.log(distance);
							for(let c = 0; c < distance; ){
								cdata2.push({x: prevtime.sub(new BigInt(++c) * span).toString(), o: prev.c, h: prev.c, l: prev.c, c: prev.c});
							}
							
						}
						cdata = cdata2;
					}
					for(let i = 0; i < cdata.length; i++){
						cdata[i].o = parseFloat(copied_web3_conv2dec(cdata[i].o.toString(), primary_converter));
						cdata[i].h = parseFloat(copied_web3_conv2dec(cdata[i].h.toString(), primary_converter));
						cdata[i].l = parseFloat(copied_web3_conv2dec(cdata[i].l.toString(), primary_converter));
						cdata[i].c = parseFloat(copied_web3_conv2dec(cdata[i].c.toString(), primary_converter));
						cdata[i].x = parseFloat(cdata[i].x) * 1000.0;
					}
					barData = cdata;
					updateChartIMPL();
				} else{
					barData = [];
					updateChartIMPL();
				}
				
				//Update bid-ask
				const bid = data[1][0];
				const ask = data[1][1];
				const bid_ask = smartGetElementById("bid_ask");
				if(!bid){
					if(ask){
						bid_ask.innerHTML = ["No buy orders, ask: ", escapeHTML(copied_web3_conv2dec(ask.toString(), primary_converter))].join("");
						return;
					} else{
						bid_ask.innerHTML = "No liquidity for instant trades, limit orders only!";
						return;
					}
				}
				if(ask){
					bid_ask.innerHTML = ["bid: ", escapeHTML(copied_web3_conv2dec(bid.toString(), primary_converter)), ", ask: ", escapeHTML(copied_web3_conv2dec(ask.toString(), primary_converter))].join("");
				} else{
					bid_ask.innerHTML = ["bid: ", escapeHTML(copied_web3_conv2dec(bid.toString(), primary_converter)), ", no sell orders"].join("");
				}
			});
		};
		reloadChartsFromServer();
		let bindPair = async function(primary, secondary){
			smartGetElementById(["pair_selector", primary, secondary].join("_")).onclick = async function(){
				selected_pri = primary;
				primary_converter = get_conv(primary);
				selected_sec = secondary;
				reloadChartsFromServer();
			};
		};
		
		//BEGIN trading pair registrations
		
		//MATIC base
		bindPair("MATIC", "PolyEUBI");
		
		//MintME base
		bindPair("MintME", "MATIC");
		bindPair("MintME", "BNB");
		bindPair("MintME", "PolyEUBI");
		bindPair("MintME", "1000x");
		bindPair("MintME", "EUBI");
		
		//BNB base
		bindPair("BNB", "PolyEUBI");
		
		//testcoins
		bindPair("shitcoin", "scamcoin");
		
		//END trading pair registrations
		
		bindPair = undefined;
		
		smartGetElementById("placeOrderButton").onclick = async function(){
			const buySelector = smartGetElementById("buy_order_selector").checked;
			bindResponseValidatorAndCall('OpenCEX_request_body=' + encodeURIComponent(['[{"method": "place_order", "data": {"primary": "', escapeJSON(selected_pri), '", "secondary": "', escapeJSON(selected_sec), '", "price": "', escapeJSON(copied_web3_conv2wei(smartGetElementById("order_price").value, primary_converter)), '", "amount": "', escapeJSON(copied_web3_conv2wei(smartGetElementById("order_amount").value, get_conv(buySelector ? selected_pri : selected_sec))), '", "buy": ', buySelector.toString(), ', "fill_mode": ', escapeJSON(smartGetElementById("fill_mode_selector").value), '}}]'].join("")), async function(){
				toast("Order placed successfully!");
			});
		};
		
	});
	callIfExists("balances_manager", async function(){
		//Unload unused Web3 modules
		const copied_web3_conv2wei = Web3.utils.toWei;
		const copied_web3_conv2dec = Web3.utils.fromWei;
		tryFreeWeb3();
		
		//Load user balances
		bindResponseValidatorAndCall("OpenCEX_request_body=%5B%7B%22method%22%3A%20%22balances%22%7D%5D", async function(e){
			e = e[0];
			if(e.length == 0){
				return "";
			} else{
				const temp = [];
				const tokenInfos = {
					MATIC: {depositable: true, withdrawable: true, type: "eth"},
					MintME: {depositable: true, withdrawable: true, type: "eth"},
					PolyEUBI: {depositable: true, withdrawable: true, type: "polygon_erc20"},
					EUBI:  {depositable: true, withdrawable: true, type: "mintme_erc20"},
					"1000x":  {depositable: true, withdrawable: true, type: "mintme_erc20"},
					BNB:  {depositable: true, withdrawable: true, type: "eth"},
					shitcoin:  {depositable: false, withdrawable: false, type: "eth"},
					scamcoin:  {depositable: false, withdrawable: false, type: "eth"}
				};
				for(let i = 0; i < e.length; i++){
					const stri = i.toString();
					const token4 = e[i][0];
					const tokenDescriptor = tokenInfos[token4];
					if(tokenDescriptor){
						const depositModeSelector = tokenDescriptor.depositable ? 'modal-trigger" href="#depositModal' : 'disabled';
						const withdrawModeSelector = tokenDescriptor.withdrawable ? 'modal-trigger" href="#withdrawModal' : 'disabled';
						const token3 = escapeHTML(token4);
						temp.push(['<tr class="row"><td class="col s4">', token3, '</td><td class="col s4">', escapeHTML(copied_web3_conv2dec(e[i][1], get_conv(token4))), '</td><td class="col s4 row"><button id="deposit_button_', stri, '" class="col s6 btn btn-small waves-effect ', depositModeSelector , '" data-deposit-token="', token3, '">deposit</button><button data-withdrawal-token="', token3, '" class="col s6 btn btn-small waves-effect ', withdrawModeSelector, '" id="withdraw_button_', stri, '">withdraw</button></td></tr>'].join(""));
					}
					
				}
				
				smartGetElementById("preloaded_balances").innerHTML = temp.join("");
				const addy = smartGetElementById("withdraw_address");
				const amt = smartGetElementById("withdraw_amount");
				for(let i = 0; i < e.length; i++){
					const stri = i.toString();
					const whatever = smartGetElementById("deposit_button_" + stri);
					if(!whatever){
						continue;
					}
					whatever.onclick = async function(){
						const token = this.dataset.depositToken;
						const tokenDescriptor = tokenInfos[token];
						const token2 = escapeJSON(token);
						if(!tokenDescriptor.depositable){
							toast("Deposits are not supported for this token!");
							return;
						}
						switch(tokenDescriptor.type){
							case "eth":
								smartGetElementById("preloaded_eth_deposit_address").style.display = "block";
								smartGetElementById("mintme_erc20_deposit_address").style.display = "none";
								smartGetElementById("polygon_erc20_deposit_address").style.display = "none";
								break;
							case "polygon_erc20":
								smartGetElementById("preloaded_eth_deposit_address").style.display = "none";
								smartGetElementById("mintme_erc20_deposit_address").style.display = "none";
								smartGetElementById("polygon_erc20_deposit_address").style.display = "block";
								break;
							case "mintme_erc20":
								smartGetElementById("preloaded_eth_deposit_address").style.display = "none";
								smartGetElementById("mintme_erc20_deposit_address").style.display = "block";
								smartGetElementById("polygon_erc20_deposit_address").style.display = "none";
								break;
							
							default:
								toast("Invalid token type!");
								return;
						}
						smartGetElementById("FinalizeTokenDeposit").onclick = async function(){
							bindResponseValidatorAndCall("OpenCEX_request_body=" + encodeURIComponent(['[{"method": "deposit", "data": {"token": "', token2, '"}}]'].join("")), async function(){
								toast("Thank you for your deposit! It will be credited to your account after 10 confirmations.");
							});
						};
					};
					smartGetElementById("withdraw_button_" + stri).onclick = async function(){
						const token = this.dataset.withdrawalToken;
						const token2 = escapeJSON(token);
						
						smartGetElementById("FinalizeTokenWithdrawal").onclick = async function(){
							bindResponseValidatorAndCall("OpenCEX_request_body=" + encodeURIComponent(['[{"method": "withdraw", "data": {"token": "', token2, '", "address": "', escapeJSON(addy.value), '", "amount": "', escapeJSON(copied_web3_conv2wei(amt.value, get_conv(token2))), '"}}]'].join("")), async function(){
								toast("withdrawal completed!");
							});
						};
					};
				}
			}
		});
	});
	
	callIfExists("orders_manager", async function(){
		const copied_web3_conv2dec = Web3.utils.fromWei;
		const preloaded_orders = smartGetElementById("preloaded_orders");
		Web3 = undefined;
		bindResponseValidatorAndCall("OpenCEX_request_body=%5B%7B%22method%22%3A%20%22load_active_orders%22%7D%5D", async function(e){
			const temp = [];
			e = e[0];
			for(let i = 0; i < e.length; i++){
				const converter = get_conv(e[i][6] ? e[i][0] : e[i][1]);
				temp.push(['<tr class="row"><td class="col s2">', escapeHTML(e[i][0]), "/", escapeHTML(e[i][1]), '</td><td class="col s2">', escapeHTML(copied_web3_conv2dec(e[i][2], get_conv(e[i][0]))), '</td><td class="col s2">', escapeHTML(copied_web3_conv2dec(e[i][3], converter)), '</td><td class="col s2">', escapeHTML(copied_web3_conv2dec(e[i][4], converter)), '</td><td class="col s2">', (e[i][6] ? "buy" : "sell"), '</td><td class="col s2 row"><button class="col s12 btn btn-small waves-effect" data-cancel-target="', escapeHTML(e[i][5]), '" id="cancel_button_', i.toString(), '">Cancel</button></td></tr>'].join(""));
			}
			preloaded_orders.innerHTML = temp.join("");
			for(let i = 0; i < e.length; i++){
				smartGetElementById("cancel_button_" + i.toString()).onclick = async function(){
					const _this = this;
					bindResponseValidatorAndCall("OpenCEX_request_body=" + encodeURIComponent(['[{"method": "cancel_order", "data": {"target": "', escapeJSON(this.dataset.cancelTarget), '"}}]'].join("")), async function(){
						preloaded_orders.removeChild(_this.parentElement.parentElement);
						toast("Order canceled successfully!");
					});
					
				};
			}
		});
	});
	
	//END TRADING FUNCTIONS
	
	//END DOM BINDINGS
	callIfExists = undefined;
	bindIfExists = undefined;
	
	M.AutoInit();
};

if (/complete|interactive|loaded/.test(document.readyState)) {
	// In case the document has finished parsing, document's readyState will
	// be one of "complete", "interactive" or (non-standard) "loaded".
	_main();
} else {
	// The document is not ready yet, so wait for the DOMContentLoaded event
	document.addEventListener('DOMContentLoaded', _main, false);
}
_main = undefined;
