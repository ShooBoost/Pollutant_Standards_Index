function loadDoc() {
    // 用 瀏覽器內建的 XMLHttpRequest 來串 API 囉
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        myFunction(this);
        console.log('ok');
        $('.loadingPage').css('top','-100%')
      }
    };
    xhttp.open("GET", "https://script.google.com/macros/s/AKfycbzS02eqKst3Od3eVETAaPOHHviTXphYZsTM_FqeEtChBy4grQk/exec?url=https://opendata.epa.gov.tw/ws/Data/AQI/?$format=json", true);
    
    xhttp.send();
}

function myFunction(xml) {
    // 將 JSON 轉成 Object
    var data = JSON.parse(xml.response);
    data.forEach(function(item){
        var nowSiteStr = item["SiteName"];
        var nowSiteArray = nowSiteStr.split("");
        // console.log(nowSiteArray);

        // 鄉鎮市區只保留 括弧內 的鄉鎮市區名稱
        // 例如：彰化(大城)，則只保留 (大城)
        nowSiteArray.forEach(function(chr, index){
            if ( chr === "("){
                nowSiteStr = ""
                for ( i = index + 1; i < nowSiteArray.length - 1 ; i++ ) {
                    nowSiteStr += nowSiteArray[i]
                };
                return;
            }else{}
        });
        item["SiteName"] = nowSiteStr;
        // console.log(nowSiteStr);
    } );


    // 列出所有縣市名單
    // 先收入所有 County
    function allCounty () {
        countyArr = [];
        data.forEach(item => countyArr.push(item["County"]));
        return countyArr;
    };
    allCountyArr = allCounty();


    // 再移除重複的 County，最後回傳無重複名單
    function removeDupCounty () {
        return allCountyArr.filter((item, index, arry) => arry.indexOf(item) === index);
    };
    allCountyArr = removeDupCounty();


    // 生成縣市清單的 html
    allCountyHtml = ''
    allCountyArr.forEach(function(item, index) {
        allCountyHtml += '<li class="county county-' + index + '"><p>' + item + '</p></li>'
    });
    $('.countys').html(allCountyHtml);


    // 預設 程式清單是收起的
    $('.countys').hide();

    // 點擊 城市清單，程式清單會展開 / 收起
    $('.countys-toggle').click(() => $('.countys').slideToggle(500, 'swing'));

    // 預設 網頁下半部是隱藏的
    hind_summary_sites_pollutant();

    function hind_summary_sites_pollutant(){
        $('.summary').hide();
        $('.sites').hide();
        $('.site-detail').hide();
    };

    function show_summary_sites_pollutant(){
        $('.summary').show();
        $('.sites').show();
        $('.site-detail').show();
    };

    $('.county').click(function(){
        // 顯示 所選縣市 與 最新更新時間
        var nowCounty = $(this).text()
        $('.now-county').text(nowCounty);
        $('.update-time').text(data[0]['PublishTime']);

        // 顯示 所選縣市旗下的 鄉鎮市區
        show_sites_of(nowCounty);

        // 點擊 鄉鎮市區後，更新 顯示該區污染數據
        $('.site').click(function(){ 
            var nowSite = $(this).children('.site-name').text();
            show_pollutant_of(nowSite)

            // 更新 依照 AQI 等級更換 AQI 數據格的背景色
            change_color();
            
            // 更新 依照 名稱長度 更換 文字大小
            change_font_size();
        });
        // 顯示 頁面下半區
        show_summary_sites_pollutant();

        // 更新 依照 AQI 等級更換 AQI 數據格的背景色
        change_color();

        // 更新 依照 名稱長度 更換 文字大小
        change_font_size();
    });

    
    // 選 county 時 hover 到的 li 會變色
    $('.county').hover(function(){
        $(this).css("background-color", "#95F084")
    },function(){
        $(this).css("background-color", "")
    });


    // 輸入 縣市，顯示旗下 鄉鎮市區
    function show_sites_of(yourCounty) {
        // 篩出 該縣市旗下的 鄉鎮市區
        siteArr = sites_filter_from(yourCounty);
        // 生成 鄉鎮市區的 html
        siteHtml = "";
        siteArr.forEach(function(item, index){
            siteHtml += `
                <div class="site site-` + index + `">
                    <div class="site-name"><p>` + item['SiteName'] + `</p></div>
                    <div class='aqi'><p>` + item['AQI'] + `</p></div>
                </div>
            `
        });
        // 顯示 鄉鎮市區的 html 到頁面
        $('.sites').html(siteHtml);

        // 顯示 第一個鄉鎮市區的 污染數據 為預設樣式
        show_pollutant_of(siteArr[0]['SiteName']);
    };

    // 依照不同文字長度，顯示不同字體大小
    function change_font_size() {
        $(".site-name p").css("font-size", function(){
            var nowName = $(this).text();
            if ( nowName.length >= 5 ) {
                return "24px"
            } else {
                return "36px"
            }
        });
    };
    
    // 依照 aqi 分數顯示不同背景顏色
    function change_color() {
        $(".aqi p").parent().attr( "class", function(){
            var aqiNum = parseInt( $(this).text() );
            
            if ( aqiNum <= 50 ) {
                return "aqi aqi-level-0";

            } else if ( 50 < aqiNum && aqiNum <= 100) {
                return "aqi aqi-level-1";

            } else if (100 < aqiNum && aqiNum <= 150) {
                return "aqi aqi-level-2";

            } else if (150 < aqiNum && aqiNum <= 200) {
                return "aqi aqi-level-3";

            } else if (200 < aqiNum && aqiNum <= 300) {
                return "aqi aqi-level-4";

            } else if (300 < aqiNum && aqiNum <= 400) {
                return "aqi aqi-level-5";
            } else {
                return "aqi";
            };
        });
    };
    

    // 篩選器，輸入縣市， return 隸屬於該縣市的 所有鄉鎮市區
    function sites_filter_from (yourCounty) {
        return data.filter(item => item["County"] === yourCounty);
    };


    // 輸入 鄉政市區，顯示其污染數據
    function show_pollutant_of (yourSiteName){
        // 篩出 該鄉鎮市區 的 空汙數據
        pollArr = pollutant_of (yourSiteName);

        // 顯示 空汙數據到頁面
        $('.site-name-now p').text(yourSiteName);
        $('.site-now .aqi p').text(pollArr[0]['AQI']);
        $('.pollutant-O .pol-data').text(pollArr[0]['O3']);
        $('.pollutant-1 .pol-data').text(pollArr[0]['PM10']);
        $('.pollutant-2 .pol-data').text(pollArr[0]['PM2.5']);
        $('.pollutant-3 .pol-data').text(pollArr[0]['CO']);
        $('.pollutant-4 .pol-data').text(pollArr[0]['SO2']);
        $('.pollutant-5 .pol-data').text(pollArr[0]['NO2']);
    };

    // 輸入指定的鄉政市區， return 該鄉鎮市區的空汙 Arr 包一個 obj
    function pollutant_of (yourSiteName) {
        return siteArr.filter(item => item["SiteName"] === yourSiteName);
    };
};

loadDoc();


