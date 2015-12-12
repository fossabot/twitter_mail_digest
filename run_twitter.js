//----------------------------------------------------------------------------------------------------------------------------------\\
//  ______     __  __     ______     ______     ______        ______   __     __     __     ______   ______   ______     ______     \\
// /\  ___\   /\ \_\ \   /\  == \   /\  ___\   /\  == \      /\__  _\ /\ \  _ \ \   /\ \   /\__  _\ /\__  _\ /\  ___\   /\  == \    \\
// \ \ \____  \ \____ \  \ \  __<   \ \  __\   \ \  __<      \/_/\ \/ \ \ \/ ".\ \  \ \ \  \/_/\ \/ \/_/\ \/ \ \  __\   \ \  __<    \\
//  \ \_____\  \/\_____\  \ \_____\  \ \_____\  \ \_\ \_\       \ \_\  \ \__/".~\_\  \ \_\    \ \_\    \ \_\  \ \_____\  \ \_\ \_\  \\
//   \/_____/   \/_____/   \/_____/   \/_____/   \/_/ /_/        \/_/   \/_/   \/_/   \/_/     \/_/     \/_/   \/_____/   \/_/ /_/  \\
//----------------------------------------------------------------------------------------------------------------------------------\\
                                                                                                                               


var nodemailer = require('nodemailer');
var Twitter    = require('twitter');

/* // for Debug of Env.:
    console.log('consumer_key= '        + process.env.consumer_key);
    console.log('consumer_secret= '     + process.env.consumer_secret);
    console.log('access_token_key= '    + process.env.access_token_key);
    console.log('access_token_secret= ' + process.env.access_token_secret);
    console.log('screen_name= '         + process.env.screen_name);

    console.log('gmail_sender_email= '  + process.env.gmail_sender_email);
    console.log('gmail_sender_pass= '   + process.env.gmail_sender_pass);
    console.log('send_digest_to_email= '+ process.env.send_digest_to_email);
*/

//---------------------------------  Main : init params and call get twitts ------------------------
function main ()
{
    var client = new Twitter({
      consumer_key         : process.env.consumer_key,
      consumer_secret      : process.env.consumer_secret,
      access_token_key     : process.env.access_token_key,
      access_token_secret  : process.env.access_token_secret
    });

    var params=  {screen_name: process.env.screen_name,  count: 200};
    var fulltweets="";

  //------------------------------------ Get twitter data ---------------------------------
    function get_twitts()
    {
        console.log ("---get twitter with :" +JSON.stringify(params));

        client.get('statuses/home_timeline', params, function(error, tweets, response){
            if (!error) {           //-------------- got first 200 tweets 

                var last_tweet=tweets[tweets.length-1];
                fulltweets+=JSON.stringify(tweets);
                            //console.log(fulltweets.length);
                        
                var difff= Date.now() - Date.parse(last_tweet.created_at);
                            // console.log("diff " +difff + " vs " + 1000*60*60*24);  // debug itteration till we get 24 H
                if (difff <1000*60*60*24)  // check we have all that was tweeted in the past 24 Hours 
                 {
                    console.log("we are not done- now get more twitts ");
                    params = {screen_name: process.env.screen_name,  count: 200, max_id:last_tweet.id };  //get from last tweet we got 
                    get_twitts();
                 }
                else
                {
                    console.log("we are done!!! -> sending to mail size:"+fulltweets.length);
                    var t= JSON.parse(fulltweets);
                    sendit(build_mail_content(t),t.length);  // now generate a mail from it 
                }
            }
            if (error) { // probably couldnt login or over quota 
                console.log("Error getting twitter home : " + JSON.stringify(error)); 
            }

        });
    }

    get_twitts(); // run for the first time 
}




//------------------------------- Send mail --------------------------
function build_mail_content (twitts)
{

 var  htmlbody ;

    htmlbody ='<b> items ' +twitts.length +'</b>'
    htmlbody+='<table style="width:100%" border="1">'

    twitts.forEach(function additemtomail(t){
        htmlbody+='<tr>'
        htmlbody+='<td><img src="' +t.user.profile_image_url +'" style="width:32px;height:32px;"></td> '
        htmlbody+='<td>'+ t.text ;
    
        
        console.log(t);
        mda=t.entities.media;
        if (typeof(mda) != "undefined"){
            console.log(">>>>>>>>");
            mda.forEach(function prnt(tt){
                    console.log(tt);
                    console.log("-----"+tt.sizes.small.w);
                    htmlbody+='<img src="' +tt.media_url +'" style="width:'+tt.sizes.small.w+'px;height:'+tt.sizes.small.h+'px;"> '
            });
            console.log("<<<<<");
        }

         htmlbody+='</td></tr>';

    }) ; 
    htmlbody+='</table>';

     console.log(htmlbody);

    return  htmlbody;
}

function sendit (html_body,item_count)
{

    console.log("******************"+ item_count);
    // create reusable transporter object using SMTP transport
    var transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.gmail_sender_email,
            pass: process.env.gmail_sender_pass
        }
    });

    // NB! No need to recreate the transporter object. You can use
    // the same transporter object for all e-mails

    var ts_hms = new Date;

   
    // setup e-mail data with unicode symbols
    var mailOptions = {
        from: 'twittermaildigest@nomail.com ✔ <twittermaildigest@nomail.com>', // sender address
        to: process.env.send_digest_to_email, // list of receivers
        subject: 'Twitter Mail Digest ✔'+ts_hms.toISOString(), // Subject line
        text: 'items' +item_count, // plaintext body
        html: html_body
    };


console.log(mailOptions);

    // send mail with defined transport object
    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            return console.log(error);
        }
        console.log('Message sent: ' + info.response);
        console.log("------------wait 6 Hours");

    });
}


//---------------------------------------  run ----------------------

main();             // run once 

setInterval(function(){
  main();
}, 1000*60*60*6 );  // now  run every 24 hours 


