/*
 Copyright 2017 IBM Corp.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

/* eslint-disable */
const options = require('minimist')(process.argv.slice(2));
const cheerio = require('cheerio');
const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();
const request = require('request-promise');
const chalk = require('chalk');

const blue = '#00007f';
let field,
	firstfield = true,
	linkText,
	href,
	fields = [],
	title = options.v,
	apiUrl = options.api,
	text,
	generatorName = options.name,
	title_link;


const $ = cheerio.load(entities.decode(options.html));

let root = $($('p')[1]).nextUntil('p');

for(var i = 0; i < root.length; i++){
		if(i == 0){
			title_link = root[0].children[0].attribs.href
		}

		if($(root[i]).is('h3')){
				if(!firstfield){
					field.value = field.value.substring(0, field.value.length-2);
					fields.push(field);
				}
				field = {
					short: false
				};
				field.title = $(root[i]).html();
				field.value = '-';

		}



		if($(root[i]).is('ul')){
			$(root[i]).children().each( (i, elem) => {
				text = $(elem).text();
				linkText = $(elem).children().html();

				if($($(elem).children().get(0)).is('a')){
					href = $(elem).children().get(0).attribs.href;
				} else if(field.title !== 'BREAKING CHANGES' && field.title !== 'Chore') {
					href = $(elem).children().get(1).attribs.href;
				} else {
					href = '';
				}

				if($($(elem).children().get(0)).is('strong')){
					let boldedText = linkText;
					text = text.replace(boldedText, `*${boldedText}*`);
					linkText = $($(elem).children().get(1)).html();
				}

				if(href !== ''){
					text = text.replace(linkText, `<${href}|${linkText}>`);
				}

				field.value+=(` ${text}\n-`);
				firstfield = false;
			})
		}
}

//push the last field
// remove extra `+/n`
if(field){
	field.value = field.value.substring(0, field.value.length-2);
	fields.push(field);
}


let body = {
	attachments : [{
		mrkdwn_in: ['fields'],
		fallback: `${generatorName} CHANGELOG Update!`,
		color : blue,
		pretext: `${generatorName} CHANGELOG Update!`,
		title: title,
		title_link: title_link,
		fields : fields
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

