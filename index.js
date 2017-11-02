/* eslint-disable */
const options = require('minimist')(process.argv.slice(2));
const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();
const request = require('request-promise');
const jsonpath = require('jsonpath');
const chalk = require('chalk');

const parser = require('parse5');

let field = {
	short: false
};

const orange = '#ffa500';
const blue = '#00007f';
const green = '#008000';
let color,
	title = options.v,
	apiUrl = options.api,
	generatorName = options.name,
	title_link;


const document = parser.parse(entities.decode(options.html));
console.log(parser.serialize(document));

const root = document.childNodes[0].childNodes[1];

field.title = jsonpath.query(root.childNodes, '$[?(@.nodeName=="h3")].childNodes[0].value',1)[0];

let list = jsonpath.query(root.childNodes, '$[?(@.nodeName=="ul")].childNodes',1)[0];

field.value = '+';
for(let i = 0; i < list.length; i++){
	let eleHtmlString = parser.serialize(list[i]);
	if(eleHtmlString !== ''){
		// convert strong to bold
		eleHtmlString = eleHtmlString.replace('<strong>', '*').replace('</strong>', '*');
		//remove href attr and clean up
		eleHtmlString = eleHtmlString.replace('<a href="', '<').replace('</a>', '').replace('"', '');

		//remove a tag value
		let index = eleHtmlString.lastIndexOf('>');
		eleHtmlString = eleHtmlString.substring(0,index+1);
		let value = jsonpath.query(list[i].childNodes, '$[?(@.tagName=="a")].childNodes[?(@.nodeName=="#text")].value')[0];
		eleHtmlString = eleHtmlString.replace('>', `|${value}>)`);
		field.value+=(`${eleHtmlString}\n+`)
	}
}

// remove extra `+/n`
field.value = field.value.substring(0, field.value.length-2);

switch(field.title){
	case 'BREAKING CHANGES' :
		color = orange;
		break;
	case 'Bug Fixes':
		color = green;
		break;
	default :
		color = blue;
		break;
}

// get link to updated tag
title_link = jsonpath.query(root.childNodes, '$[?(@.nodeName=="h2")].childNodes[?(@.nodeName=="a")].attrs[0].value',1)[0];

let body = {
	attachments : [{
		mrkdwn_in: ['fields'],
		fallback: `${generatorName} CHANGELOG Update!`,
		color : color,
		pretext: `${generatorName} CHANGELOG Update!`,
		title: title,
		title_link: title_link,
		fields : [field]
	}]
};

let requestOptions = {
	method : 'POST',
	uri: apiUrl,
	body : body,
	json: true
};

request(requestOptions)
	.then((res) => {
		console.log(chalk.blue(res))
	})
	.catch((err) => {
		console.error(chalk.red(err));
	});





