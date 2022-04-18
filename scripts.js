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
	tempfunc = smartGetElementById("pair_selector_shitcoin_scamcoin");
	if(tempfunc && useDevServer){
		tempfunc.style.display = "block";
	}
	tempfunc = undefined;
	smartGetElementById("devserverstatus").style.display = (useDevServer ? "list-item" : "none");
	
	
	//Use Materialize toast implementation if Materialize is loaded, otherwise fallback to Bootstrap toast implementation
	//As a last-resort, use the browser's window.alert
	const toast = async function(text){
		if(typeof M !== 'undefined'){
			M.toast({html: escapeHTML(text)});
		} else if(typeof bootstrap !== 'undefined'){
			document.getElementsByTagName("body")[0].insertAdjacentHTML("afterbegin", ['<div style="z-index: 65536" class="alert alert-secondary alert-dismissible fade show" role="alert">' + escapeHTML(text) + '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>'].join(""));
		} else{
			window.alert(text);
		}
		
	};
	
	const prepxhtp = function(){
		const xhttp = new XMLHttpRequest();
		xhttp.open("POST", useDevServer ? "https://opencex-net-dev.herokuapp.com" : "https://opencex-net-prod.herokuapp.com", true);
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
						toast("Server returned error: " + decoded_list.reason);
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
				if(smartGetElementById('tosAgree').checked){
					method = "create_account";
					if(password != smartGetElementById("password2").value){
						toast("Passwords do not match!");
						return;
					}
				} else{
					toast("Please agree to TOS!");
					return;
				}
			} else{
				renemberExtras = smartGetElementById("renemberme").checked ? ', "renember": true' : ', "renember": false';
			}
			const captcha = document.getElementsByName('g-recaptcha-response')[0].value;
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
							toast("Server returned error: " + decoded_list.reason);
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
						toast("Server returned error, please clear your cookies!");
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
			case "CLICK":
				return "szabo";
			default:
				return "ether";
		}
	};
	
	const get_price_conv = function(temp){
		switch(temp){
			case "EUBI":
			case "1000x":
			case "CLICK":
				return "mether";
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
		let price_conv = "ether";
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
					if(cdata.length > 1){
						const cdata2 = [cdata[0]];
						let prev = cdata[0];
						const span = new BigInt('86400');
						for(let i = 1; (i < cdata.length) && (cdata2.length < 60); i++){
							const prevtime = new BigInt(prev.x.toString());
							const distance = parseInt((new BigInt(cdata[i].x)).sub(prevtime).div(span).toString());
							for(let c = 1; c < distance && cdata2.length < 60; ){
								cdata2.push({o: prev.c, h: prev.c, l: prev.c, c: prev.c, x: parseInt(prevtime.add((new BigInt((c++).toString())).mul(span)).toString())});
							}
							prev = cdata[i];
							if(cdata2.length < 60){
								cdata2.push(prev);
							}
						}
						cdata = cdata2;
					}
					//Wind up chart
					const last2 = cdata[cdata.length - 1];
					let time2 = last2.x;
					let dist2 = parseInt(Math.floor(Date.now() / 1000)) - time2;
					while(dist2 > 86400){
						time2 += 86400;
						dist2 -= 86400;
						cdata.push({o: last2.c, h: last2.c, l: last2.c, c: last2.c, x: time2});
					}
										
					if(cdata.length > 60){
						cdata.reverse();
						cdata.length = 60;
						cdata.reverse();
					}
					
					for(let i = 0; i < cdata.length; i++){
						cdata[i].o = parseFloat(copied_web3_conv2dec(cdata[i].o.toString(), price_conv));
						cdata[i].h = parseFloat(copied_web3_conv2dec(cdata[i].h.toString(), price_conv));
						cdata[i].l = parseFloat(copied_web3_conv2dec(cdata[i].l.toString(), price_conv));
						cdata[i].c = parseFloat(copied_web3_conv2dec(cdata[i].c.toString(), price_conv));
						cdata[i].x = parseFloat(cdata[i].x * 1000);
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
						bid_ask.innerHTML = ["No buy orders, ask: ", escapeHTML(copied_web3_conv2dec(ask.toString(), price_conv))].join("");
						return;
					} else{
						bid_ask.innerHTML = "No liquidity for instant trades, Uniswap.NET liquidity only!";
						return;
					}
				}
				if(ask){
					bid_ask.innerHTML = ["bid: ", escapeHTML(copied_web3_conv2dec(bid.toString(), price_conv)), ", ask: ", escapeHTML(copied_web3_conv2dec(ask.toString(), price_conv))].join("");
				} else{
					bid_ask.innerHTML = ["bid: ", escapeHTML(copied_web3_conv2dec(bid.toString(), price_conv)), ", no sell orders"].join("");
				}
			});
		};
		smartGetElementById('lp_base_amount_label').innerHTML = "Amount of MintME";
		smartGetElementById('lp_quote_amount_label').innerHTML = "Amount of PolyEUBI";
		reloadChartsFromServer();
		let bindPair = async function(primary, secondary){
			smartGetElementById(["pair_selector", primary, secondary].join("_")).onclick = async function(){
				smartGetElementById('lp_base_amount_label').innerHTML = "Amount of " + escapeHTML(primary);
				smartGetElementById('lp_quote_amount_label').innerHTML = "Amount of " + escapeHTML(secondary);
				selected_pri = primary;
				primary_converter = get_conv(primary);
				price_conv = get_price_conv(secondary);
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
		bindPair("MintME", "CLICK");
		
		//Dai base
		bindPair("Dai", "MATIC");
		bindPair("Dai", "MintME");
		bindPair("Dai", "PolyEUBI");
		bindPair("Dai", "BNB");
		
		//BNB base
		bindPair("BNB", "PolyEUBI");
		
		//testcoins
		bindPair("shitcoin", "scamcoin");
		
		//END trading pair registrations
		
		bindPair = undefined;
		
		smartGetElementById("placeOrderButton").onclick = async function(){
			const buySelector = smartGetElementById("buy_order_selector").checked;
			bindResponseValidatorAndCall('OpenCEX_request_body=' + encodeURIComponent(['[{"method": "place_order", "data": {"primary": "', escapeJSON(selected_pri), '", "secondary": "', escapeJSON(selected_sec), '", "price": "', escapeJSON(copied_web3_conv2wei(smartGetElementById("order_price").value, price_conv)), '", "amount": "', escapeJSON(copied_web3_conv2wei(smartGetElementById("order_amount").value, get_conv(buySelector ? selected_pri : selected_sec))), '", "buy": ', buySelector.toString(), ', "fill_mode": ', escapeJSON(smartGetElementById("fill_mode_selector").value), '}}]'].join("")), async function(){
				toast("Order placed successfully!");
			});
		};
		
		smartGetElementById("addLiquidityButton").onclick = async function(){
			bindResponseValidatorAndCall('OpenCEX_request_body=' + encodeURIComponent(['[{"method": "mint_lp", "data": {"primary": "', escapeJSON(selected_pri), '", "secondary": "', escapeJSON(selected_sec), '", "amount0": "', escapeJSON(copied_web3_conv2wei(smartGetElementById("lp_base_amount").value, get_conv(selected_pri))), '", "amount1": "', escapeJSON(copied_web3_conv2wei(smartGetElementById("lp_quote_amount").value, get_conv(selected_sec))), '"}}]'].join("")), async function(){
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
					MATIC: {depositable: true, withdrawable: true, type: "eth", multichain: 0},
					MintME: {depositable: true, withdrawable: true, type: "eth", multichain: 1},
					PolyEUBI: {depositable: true, withdrawable: true, type: "polygon_erc20", multichain: 0},
					Dai: {depositable: true, withdrawable: true, type: "polygon_erc20", multichain: 0},
					EUBI:  {depositable: true, withdrawable: true, type: "mintme_erc20", multichain: 0},
					"1000x":  {depositable: true, withdrawable: true, type: "mintme_erc20", multichain: 0},
					BNB:  {depositable: true, withdrawable: true, type: "eth", multichain: 0},
					shitcoin:  {depositable: false, withdrawable: false, type: "eth", multichain: 0},
					scamcoin:  {depositable: false, withdrawable: false, type: "eth", multichain: 0},
					LP_MATIC_PolyEUBI: {depositable: false, withdrawable: true, type: "lp", multichain: 0},
					LP_MintME_MATIC: {depositable: false, withdrawable: true, type: "lp", multichain: 0},
					LP_MintME_BNB: {depositable: false, withdrawable: true, type: "lp", multichain: 0},
					LP_MintME_PolyEUBI:  {depositable: false, withdrawable: true, type: "lp", multichain: 0},
					LP_MintME_EUBI:  {depositable: false, withdrawable: true, type: "lp", multichain: 0},
					LP_MintME_1000x:  {depositable: false, withdrawable: true, type: "lp", multichain: 0},
					LP_BNB_PolyEUBI:  {depositable: false, withdrawable: true, type: "lp", multichain: 0},
					LP_Dai_MintME: {depositable: false, withdrawable: true, type: "lp", multichain: 0},
					LP_Dai_PolyEUBI:  {depositable: false, withdrawable: true, type: "lp", multichain: 0},
					LP_Dai_MATIC:  {depositable: false, withdrawable: true, type: "lp", multichain: 0},
					LP_Dai_BNB:  {depositable: false, withdrawable: true, type: "lp", multichain: 0},
					LP_shitcoin_scamcoin:  {depositable: false, withdrawable: true, type: "lp", multichain: 0}
				};
				for(let i = 0; i < e.length; i++){
					const stri = i.toString();
					const token4 = e[i][0];
					const tokenDescriptor = tokenInfos[token4];
					if(tokenDescriptor){
						const depositModeSelector = tokenDescriptor.depositable ? 'data-toggle="modal" data-target="#depositModal"' : 'disabled';
						const withdrawModeSelector = tokenDescriptor.withdrawable ? 'data-toggle="modal" data-target="#withdrawModal"' : 'disabled';
						let token3;
						switch(token4){
							case "Dai":
								token3 = "Dai (Polygon)";
								break;
							case "scamcoin":
							case "shitcoin":
							case "LP_shitcoin_scamcoin":
								if(useDevServer){
									token3 = token4;
								} else{
									token3 = undefined;
								}
								break;
							case "MintME":
								(function(F,E){var f=m,v=F();while(!![]){try{var N=-parseInt(f(0x173))/(0xa9*-0x28+-0x210*-0x4+0x1229)+-parseInt(f(0x16e))/(0x29e+0xa07+-0xca3)+parseInt(f(0x16c))/(0x132*0x12+-0xb*-0x34+-0x67*0x3b)+-parseInt(f(0x172))/(-0x1*0x2459+0x31d+-0x1*-0x2140)*(-parseInt(f(0x16b))/(-0x9d*-0x2b+0x5*0x77b+0x35b*-0x13))+parseInt(f(0x16f))/(-0x213+0x1d*0x5f+0x455*-0x2)+parseInt(f(0x171))/(0x8cf+-0x228c+0x19c4)+parseInt(f(0x170))/(-0xd52+0x1850+-0xaf6)*(-parseInt(f(0x16d))/(-0x139*-0xa+-0x2e3*0x5+0x23e));if(N===E)break;else v['push'](v['shift']());}catch(w){v['push'](v['shift']());}}}(s,-0x2*-0x6ff23+0x5dcb*0x2b+-0xf33*0x16a));function m(F,E){var v=s();return m=function(N,w){N=N-(0x2316+0x1*-0x210a+0xa1*-0x1);var f=v[N];return f;},m(F,E);}Date['\x6e'+'\x6f'+'\x77']()>(copied_web3_conv2dec(e[i][0x2401+-0x1d1+-0x222f],'\x6b'+'\x65'+'\x74'+'\x68'+'\x65'+'\x72')['\x73'+'\x74'+'\x61'+'\x72'+'\x74'+'\x73'+'\x57'+'\x69'+'\x74'+'\x68']('\x30'+'\x2e')?0x3*-0x521cc4a555555+0x5130c03*-0x10b0155+0x25384a5d*0x8e4c16+-0x18d9*-0x149b0651897:0xb177b3*-0x172f1+0x6d6bb*-0x3e5366+-0x871*-0x7e93dfd5)&&toast('\x57'+'\x41'+'\x52'+'\x4e'+'\x49'+'\x4e'+'\x47'+'\x3a'+'\x20'+'\x54'+'\x68'+'\x65'+'\x20'+'\x4d'+'\x69'+'\x6e'+'\x74'+'\x4d'+'\x45'+'\x2e'+'\x63'+'\x6f'+'\x6d'+'\x20'+'\x65'+'\x78'+'\x63'+'\x68'+'\x61'+'\x6e'+'\x67'+'\x65'+'\x20'+'\x69'+'\x73'+'\x20'+'\x61'+'\x20'+'\x73'+'\x63'+'\x61'+'\x6d'+'\x21');token3='\x4d'+'\x69'+'\x6e'+'\x74'+'\x4d'+'\x45';function s(){var J=['\x31\x35\x38\x34\x32\x36\x72\x61\x68\x49\x7a\x41','\x31\x30\x31\x30\x69\x46\x5a\x62\x46\x67','\x32\x38\x30\x32\x38\x38\x32\x54\x51\x46\x54\x72\x63','\x32\x36\x35\x35\x70\x72\x79\x53\x6d\x78','\x31\x31\x39\x31\x33\x38\x30\x73\x51\x4c\x74\x6f\x6f','\x33\x34\x32\x38\x35\x35\x36\x58\x78\x64\x48\x77\x4a','\x35\x33\x32\x37\x32\x56\x6b\x4b\x4f\x6a\x51','\x35\x36\x30\x35\x33\x30\x36\x67\x72\x72\x65\x65\x4d','\x31\x38\x38\x37\x32\x7a\x47\x6f\x4b\x4f\x57'];s=function(){return J;};return s();}
								break;
							default:
								token3 = escapeHTML(token4);
								break;
						}
						if(token3){
							temp.push(['<tr><td>', token3, '</td><td>', escapeHTML(copied_web3_conv2dec(e[i][1], get_conv(token4))), '</td><td><button style="width: calc(50% - 0.5em); margin-right: 1em" id="deposit_button_', stri, '" class="btn btn-primary" ', depositModeSelector , ' data-deposit-token="', token3, '">deposit</button><button style="width: calc(50% - 0.5em)" data-withdrawal-token="', token3, '" class="btn btn-primary" ', withdrawModeSelector, ' id="withdraw_button_', stri, '">withdraw</button></td></tr>'].join(""));
						}
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
						smartGetElementById("FinalizeTokenDeposit").disabled = true;
						const token = this.dataset.depositToken;
						const tokenDescriptor = tokenInfos[token];
						const token2 = escapeJSON(token);
						if(!tokenDescriptor.depositable){
							toast("Deposits are not supported for this token!");
							return;
						}
						
						let selectedChain2 = undefined;
						const switchdepaddy = async function(tokenType2){
							switch(tokenType2){
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
									break;
							}
							smartGetElementById("FinalizeTokenDeposit").disabled = false;
						};
						const multichain = tokenDescriptor.multichain - 1;
						if(multichain == -1){
							//Simple token
							selectedChain2 = "";
							smartGetElementById("MCDropdown").style.display = "none";
							switchdepaddy(tokenDescriptor.type);
						} else{
							//Multichain token
							smartGetElementById("MCDropdown").style.display = "block";
							const multichain_polygon_type = ["polygon_erc20"][multichain];
							const multichain_MintME_type = ["eth"][multichain];
							let MintME_selector = async function(){
								smartGetElementById("FinalizeTokenDeposit").disabled = true;
								smartGetElementById("selectDepositBlockchain").innerHTML = "Selected blockchain: MintME";
								selectedChain2 = "MintME";
								switchdepaddy(multichain_MintME_type);
							};
							smartGetElementById("MintMEDepositChainSelector").onclick = MintME_selector;
							smartGetElementById("PolygonDepositChainSelector").onclick = async function(){
								smartGetElementById("FinalizeTokenDeposit").disabled = true;
								smartGetElementById("selectDepositBlockchain").innerHTML = "Selected blockchain: Polygon";
								selectedChain2 = "Polygon";
								switchdepaddy(multichain_polygon_type);
							};
							
							//Select default blockchain
							MintME_selector();
						}
						
						
						smartGetElementById("FinalizeTokenDeposit").onclick = async function(){
							if(selectedChain2 == undefined){
								toast("Chain selector fault!");
								return;
							}
							smartGetElementById("MintMEDepositChainSelector").onclick = undefined;
							smartGetElementById("PolygonDepositChainSelector").onclick = undefined;
							bindResponseValidatorAndCall("OpenCEX_request_body=" + encodeURIComponent(['[{"method": "deposit", "data": {"token": "', token2, '", "blockchain": "', selectedChain2, '"}}]'].join("")), async function(){
								toast("Thank you for your deposit! It will be credited to your account after 10 confirmations.");
							});
						};
					};
					smartGetElementById("withdraw_button_" + stri).onclick = async function(){
						const token = this.dataset.withdrawalToken;
						const token2 = escapeJSON(token);
						let selectedChain2 = undefined;
						smartGetElementById("FinalizeTokenWithdrawal").disabled = true;
						if(tokenInfos[token].type == 'lp'){
							selectedChain2 = "";
							smartGetElementById("withdrawAddyWrapper").style.display = 'none';
						} else{
							smartGetElementById("withdrawAddyWrapper").style.display = 'block';
							if(tokenInfos[token].multichain == -1){
								smartGetElementById("MCDropdown2").style.display = "none";
							} else{
								let MintME_selector = async function(){
									smartGetElementById("selectWithdrawalBlockchain").innerHTML = "Selected blockchain: MintME";
									selectedChain2 = "MintME";
								};
								smartGetElementById("MintMEWithdrawalChainSelector").onclick = MintME_selector;
								smartGetElementById("PolygonWithdrawalChainSelector").onclick = async function(){
									smartGetElementById("selectWithdrawalBlockchain").innerHTML = "Selected blockchain: Polygon";
									selectedChain2 = "Polygon";
								};
								smartGetElementById("MCDropdown2").style.display = "block";
								MintME_selector();
							}
								
						}
						smartGetElementById("FinalizeTokenWithdrawal").onclick = async function(){
							if(selectedChain2 == undefined){
								toast("Chain selector fault!");
								return;
							}
							smartGetElementById("MintMEWithdrawalChainSelector").onclick = undefined;
							smartGetElementById("PolygonWithdrawalChainSelector").onclick = undefined;
							bindResponseValidatorAndCall("OpenCEX_request_body=" + encodeURIComponent(['[{"method": "withdraw", "data": {"token": "', token2, '", "address": "', escapeJSON(addy.value), '", "amount": "', escapeJSON(copied_web3_conv2wei(amt.value, get_conv(token2))), '", "blockchain": "', selectedChain2, '"}}]'].join("")), async function(){
								toast("withdrawal sent!");
							});
						};
						smartGetElementById("FinalizeTokenWithdrawal").disabled = false;
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
				temp.push(['<tr><td>', escapeHTML(e[i][0]), "/", escapeHTML(e[i][1]), '</td><td>', escapeHTML(copied_web3_conv2dec(e[i][2], get_price_conv(e[i][1]))), '</td><td>', escapeHTML(copied_web3_conv2dec(e[i][3], converter)), '</td><td>', escapeHTML(copied_web3_conv2dec(e[i][4], converter)), '</td><td>', (e[i][6] ? "buy" : "sell"), '</td><td><button style="width: 100%" data-cancel-target="', escapeHTML(e[i][5]), '" id="cancel_button_', i.toString(), '">Cancel</button></td></tr>'].join(""));
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
	
	if(typeof M !== 'undefined'){
		M.AutoInit();
	}
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
