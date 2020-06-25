//Input URL and return Articles as a json component.
export async function NewsApiLoader(url) {
    
    let item;
    let articles = [];
    item = await fetch(url).then(r => r.json());
    item = await item.articles;

    //If there is no box to get in information, it doesn't work...
    for (let i=0; i < item.length; i++) {
        articles[i] = 1;
    }

    for(let i=0;i < item.length; i++) {
        articles[i] = await item[i];
        //Cut the title's end like "- CNN.com"
        let title = articles[i].title;
        for (let j=title.length; j > 0; j--){
            if (title[j]=="-"){
                articles[i].title = await title.slice(0, j);
                break;
            }
        }
        //Get no-image.png if no image
        if(articles[i].urlToImage == null) {
            articles[i].urlToImage = "./image/no-image.png";
        }
        //Change .source to .source.name because deeper than one layer cannot be accessed...
        articles[i].source = await articles[i].source.name;
    }
    return articles;
}



//Input inputText and event binded to the <input> tag, then return new URL.
export function SearchUrl(inputText) {
    let search_url;
    let keywords;
    if (inputText.length==0){
        return null;
    }
    keywords = inputText.split(" ");
    search_url = "http://newsapi.org/v2/everything?q=";
    for (let i=0;i < keywords.length; i++){
        search_url += keywords[i] + "+";
    }
    search_url = search_url.slice(0,-1) + '&pageSize=100' + "&apiKey=5ccb5225a99744a3960174e417badf08";
    return search_url
}

export function num_display_articles(articles, num) {
    let new_articles = [];
    let num_box = Math.floor(articles.length / num) + 1;
    for (let i=0; i < num_box; i++) {
        if (i == num_box - 1)  {
            new_articles.push(articles.slice(num * i))
        } else {
            new_articles.push(articles.slice(i * num, (i + 1) * num))
        }
    }
    return new_articles;
}

//sourceLoad returns news sources as a dict. The data are in ./public/data/sources.json
export async function sourceLoad() {
    const sourceLoc = "./data/sources.json";
    let item = await fetch(sourceLoc).then(r => r.json());
    let sources = new Array();
    for(let i=0;i<150;i++) {
        if(item[i]){
            let info = {
                checked: false,
                name: item[i].name, 
                source: item[i].source
            }
            sources.push(info);
        }
    }
    return sources;
}

//Get articles and break them into a list, num is a number of articles in one chunk.
export function MakeArticlesList(articles, num) {
    let articles_list = [];
    let i = 0;
    while(true) {
        if(i+num >= articles.length) {
            articles_list.push({ articles: articles.slice(i,), isActive: false });
            break;
        } else {
            articles_list.push({ articles: articles.slice(i, i+num), isActive: false});
        }
        i += num;
    }
    articles_list[0].isActive = true;
    console.log(articles_list)
    return articles_list;
}