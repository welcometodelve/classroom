/*global $, jQuery, console, alert, GGBApplet, renderGGBElement, GGBT_wsf_general*/


window.GGBT_wsf_general = (function($) {
    "use strict";

    var wsfInfo = null,
        wsfInfoContent = null,
        pageInfoState = false,
        wsfActiveContent = null,
        wsfCurrentContent = null,
        wsfButtonInfoClose = null,
        WSF_CLIENT_ID = 0,
        CLASS_TEXT = "wsf-text",
        CLASS_VIDEO = "wsf-video",
        CLASS_APPLET = "wsf-applet",
        CLASS_IMAGE = "wsf-image",
        CLASS_QUESTION = "wsf-question",
        CLASS_EXERCISE = "wsf-exercise",
        CLASS_PDF = "wsf-pdf",
        CLASS_META = "wsf-meta",
        CLASS_APPLET_EDIT = "wsf-applet-edit",
        CLASS_COMMENT = "wsf-comment",
        CLASS_WEB = "wsf-web",
        ELEM_TYPE_Question = 'Q',
        ELEM_TYPE_Exercise = 'E',
        ELEM_TYPE_GeoGebraApplet = 'G',
        wsfActiveInfo,
        wsfWorksheet = null,
        wsfPage = null,
        data = null,
        defaults;

    function getWsfInfo() {
        if (wsfInfo === null) {
            wsfInfo = $(".wsf-info-wrapper");
        }
        return wsfInfo;
    }

    function getWsfInfoContent() {
        if (wsfInfoContent === null) {
            wsfInfoContent = $("#wsf-content-info");
        }
        return wsfInfoContent;
    }

    function getWorksheet() {
        if (wsfWorksheet === null) {
            wsfWorksheet = $(".wsf-ws-scroller");
        }
        return wsfWorksheet;
    }

    function getContainerWorksheet(element) {
        return element.parents(".wsf-ws-scroller");
    }

    function getContainerPage(element) {
        return getContainerWorksheet(element).parent();
    }

    /**
     * Returns the active page. The page contains the worksheet and the header
     */
    function getPage() {
        return getWorksheet().parent();
    }

    /**
     * Returns the worksheet header
     */
    function getHeader() {
        return $('.j-ws-header', getPage());
    }

    function getFeedbackHeader() {
        return $('.j-feedback-header', getPage());
    }

    function getFooter() {
        return $('.jWS-footer', getPage());
    }

    function getAllWorksheets() {
        return $(".wsf-ws-scroller");
    }

    function setWorksheet(worksheet) {
        if (worksheet.has('.wsf-ws-scroller').length > 0) {
            worksheet = $('.wsf-ws-scroller', worksheet);
        }
        wsfWorksheet = worksheet;
    }

    function getButtonInfoClose() {
        if (wsfButtonInfoClose === null) {
            wsfButtonInfoClose = $(".wsf-button-information-close");
        }
        return wsfButtonInfoClose;
    }

    function setWsfCurrentContent(currentContent) {
        wsfCurrentContent = currentContent;
    }

    function generateClientId() {
        return "wsf_client_" + WSF_CLIENT_ID++;
    }

    function saveContentClientId(content, element) {
        if (!element.clientId) {
            element.clientId = generateClientId();
        }
        content.attr("data-content-client_id", element.clientId);
    }

    function setInfoTitle(title) {
        $("#wsf-info-title").html(defaults.info.title.text + (title !== "" ? ": " + title : ""));
    }

    function adjustContentToResize(content) {
        if (typeof window.GGBT_wsf_view === "object" && window.GGBT_wsf_view.isFullscreen()) {
            return; // the ws-element container does not have to be adjusted in fullscreen mode
        }

        var article = $('article', content),
            boundingRect, width, height;


        var container = $('.applet_container', content);
        if (container.length > 0) {
            boundingRect = container.get(0).getBoundingClientRect();
            width = boundingRect.width;
            height = boundingRect.height;
        }

        if (height !== undefined && height > 0 && content.find(".ws-element-applet").length) {
            content.find(".ws-element-applet").height(height);
        }


        if (width !== undefined && width > 0) {
            content.width(width);
            adjustContentMaxWidth(content.parents(".wsf-content-added"), width);
        } else {
            content.css({
                width: "auto",
                height: "auto"
            });
        }
    }

    function adjustContentMaxWidth(content, newWidth) {

        // Change the max-width of the content if it is smaller then the applet/image
        var currMaxWidth = parseInt(content.css("max-width"));
        var newMaxWidth = 700;
        if (newWidth > newMaxWidth) {
            newMaxWidth = newWidth;
        }
        if (currMaxWidth !== newMaxWidth) {
            content.css("max-width", newMaxWidth+"px");

        }

        if (content.hasClass("worksheet_element")) {
            // In view mode, set the width of the element to the applet width
            content.width(newWidth);
        }

    }

    function buildYouTubeVideo(link) {
        var videoId;
        if (link.indexOf("www.youtube.com/embed/") > -1) {
            return '<iframe class="video" width="560" height="315" src="'+ link +'" frameborder="0" allowfullscreen></iframe>';
        } else if (link.indexOf("www.youtube.com") > -1) {
            videoId = link.split("=")[1];
        } else {
            videoId = link.substring(link.lastIndexOf("/")+1);
        }
        return '<iframe class="video" width="560" height="315" src="//www.youtube.com/embed/' + videoId + '" frameborder="0" allowfullscreen></iframe>';
    }

    function buildVimeoVideo(link) {
        var videoId = link.substring(link.lastIndexOf("/")+1);
        return '<iframe class="video" width="560" height="315" src="//player.vimeo.com/video/' + videoId + '" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>';
    }

    function buildHtml5Video(link) {
        var type;
        if (link.indexOf(".ogv") > -1 || link.indexOf(".ogg") > -1) {
            type = "ogg";
        } else if (link.indexOf(".mp4") > -1) {
            type = "mp4";
        }
        return '<video class="video" type="video/' + type + '" width="560" height="315" src="' + link + '" />';
    }

    function buildVideoFromLink(link) {
        if (!link) {
            return null;
        }
        var content;
        if (link.indexOf("www.youtube.com") > -1 || link.indexOf("youtu.be") > -1) {
            content = buildYouTubeVideo(link);
        } else if (link.indexOf("vimeo.com") > -1) {
            content = buildVimeoVideo(link);
        } else {
            content = buildHtml5Video(link);
        }
        return $(content).attr("data-link", link);
    }

    function buildVideoContent(title, video, copy) {
      var wrapper = $('<li class="' + CLASS_VIDEO +  ' wsf-content-added" />').append(
        $('<h5 class="content-added-title" />').text(title)),
            content = $('<div class="content-added-content" />'),
            vid;

        if (copy) {
            vid = video.clone();
        } else {
            vid = video;
        }
        content.append(vid);
        wrapper.append(content).appendTo(wsfCurrentContent);
        return wrapper;
    }

    function buildQuestionBody(qa) {
        var result = $("<div/>");
        result.append('<div class="wsf-question">' + window.GGBT_texthandlers.getHTMLFromBBCode(qa.question, true) + '</div>');
        if (qa.choices && qa.choices.length) {
            qa.choices.forEach(function(ch, index) {
                var type = String(qa.allowMultipleAnswers) === "true" ? 'checkbox' : 'radio',
                    check = String(qa.answer[index]) === "true" ? " checked" : "";
                result.append('<label class="wsf-multiple-answer"><input type="' + type + '"' + check + ' name="wsf-answer"/><span>' + window.GGBT_texthandlers.getHTMLFromBBCode(ch.choice, true) + '</span></label>');
            });
        } else {
            result.append('<textarea class="wsf-open-answer"></textarea>');
            window.GGBT_texthandlers.initBBCodeEditor(result.find(".wsf-open-answer"), {
                defaults: defaults
            });
            result.find(".wsf-open-answer").bbcode(qa.answer).sync();
        }
        return result;
    }

    function buildQuestionContent(title, qa, points_max) {
        var wrapper = $('<li class="' + CLASS_QUESTION + ' wsf-content-added" />').append(
            $('<h5 class="content-added-title" />').text(title)),
            content = $('<div class="content-added-content" />'),
            q;
        if (typeof qa === "string") {
            q = JSON.parse(qa);
        } else {
            q = qa;
        }
        content.attr("data-qa", JSON.stringify(q));
        content.attr("data-points_max", points_max);
        content.append(buildQuestionBody(q));
        wrapper.append(content).appendTo(wsfCurrentContent);
        return wrapper;
    }

    function buildExerciseContent(title, exercise, copy, points_max) {
        var wrapper = $('<li class="' + CLASS_EXERCISE + ' wsf-content-added" data-type="' + ELEM_TYPE_Exercise + '" />').append(
            $('<h5 class="content-added-title" />').text(title)),
            content = $('<div class="content-added-content" />'),
            a;

        if (exercise.task) {
            content.append('<div class="wsf-exercise-task">' + window.GGBT_texthandlers.getHTMLFromBBCode(exercise.task, true) + '</div>');
        }
        var exerciseData = {
            task : exercise.task,
            perspective : exercise.perspective
        };
        if (exercise.hasAutoCheckExercise) {
            exerciseData.hasAutoCheckExercise = exercise.hasAutoCheckExercise;
            exerciseData.autoCheck = exercise.autoCheck;
            exerciseData.showPoints = exercise.showPoints;
            exerciseData.showHints = exercise.showHints;
        }
        content.attr("data-exercise", JSON.stringify(exerciseData));
        content.attr("data-points_max", points_max);

        if (copy) {
            a = exercise.applet.clone();
            addNewDataParamId(a);
        } else {
            a = exercise.a;
        }
        if (a) {
            content.append(a);
        } else {
            content.append('<div class="applet-content"></div>');
        }
        wrapper.append(content).appendTo(wsfCurrentContent);
        if (copy) {
            renderGGBElement(a.get(0), function() {
                adjustContentToResize(content);
            });
        }
        return wrapper;
    }

    function buildImageContent(title, image, description, copy) {
        var wrapper = $('<li class="' + CLASS_IMAGE +  ' wsf-content-added" />').append(
              $('<h5 class="content-added-title" />').text(title)),
            content = $('<div class="content-added-content" />'),
            img;
        if (copy) {
            img = image.clone();
        } else {
            img = image;
        }
        content.append(img);
        if (description) {
            content
                .append('<div class="image-description">' + window.GGBT_texthandlers.getHTMLFromBBCode(description, true) + '</div>')
                .attr("data-description", encodeURIComponent(description));
        }
        wrapper.append(content).appendTo(wsfCurrentContent);
        return wrapper;
    }

    function buildWebContent(title, frame) {
      var wrapper = $('<li class="' + CLASS_WEB +  ' wsf-content-added" />').append(
            $('<h5 class="content-added-title" />').text(title)),
          content = $('<div class="content-added-content" />');
        frame.addClass("webcontent");
        content.append(frame);
        wrapper.append(content).appendTo(wsfCurrentContent);
        return wrapper;
    }

    function buildTextContent(title, bbcode) {
        var html = window.GGBT_texthandlers.getHTMLFromBBCode(bbcode, true);
        var wrapper = $('<li class="' + CLASS_TEXT +  ' wsf-content-added" />').append(
                $('<h5 class="content-added-title" />').text(title)),
            content = $('<div class="content-added-content" data-text-bbcode="' + encodeURIComponent(bbcode) + '">' + html + '</div>');
        wrapper.append(content).appendTo(wsfCurrentContent);

        if (window.GGBT_texthandlers.isLatexRenderer("mathquill")) {
            $('.mathquill-embedded-latex', content).mathquill();
        }
        return wrapper;
    }

    function addEventsToPdfContent(content) {
        content.on("click", ".pdf_link", function(e) {
            e.preventDefault();
            e.stopPropagation();
            var title = $(this).parents('.wsf-content-added').find('.content-added-title').text();
            window.GGBT_gen_modal.showPdfPopup($(this).attr("data_href"), title);
        });
    }

    function buildPdfContent(title, link) {
        var wrapper = $('<li class="' + CLASS_PDF +  ' wsf-content-added" />').append(
            $('<h5 class="content-added-title" />').text(title)),
            content = $('<div class="content-added-content" />').html(link);

        wrapper.append(content).appendTo(wsfCurrentContent);
        addEventsToPdfContent(wrapper);
        return wrapper;
    }

    function addNewDataParamId(ap) {
        ap.attr("data-param-id", "copy_" + Date.now());
    }

    function buildAppletContent(title, applet, copy, exercise) {
        var wrapper = $('<li class="' + CLASS_APPLET +  ' wsf-content-added" data-type="' + ELEM_TYPE_GeoGebraApplet + '" />').append(
            $('<h5 class="content-added-title" />').text(title)),
            content = $('<div class="content-added-content" />'),
            ap;

        var exerciseData = {};
        if (exercise && exercise.hasAutoCheckExercise) {
            exerciseData.hasAutoCheckExercise = exercise.hasAutoCheckExercise;
            exerciseData.autoCheck = exercise.autoCheck;
            exerciseData.showPoints = exercise.showPoints;
            exerciseData.showHints = exercise.showHints;
        }
        content.attr("data-exercise", JSON.stringify(exerciseData));

        if (copy) {
            ap = applet.clone();
            addNewDataParamId(ap);
        } else {
            ap = applet;
        }
        if (ap !== null) {
            content.append(ap);
        }
        wrapper.append(content).appendTo(wsfCurrentContent);
        if (copy) {
            renderGGBElement(ap.get(0), function() {
                adjustContentToResize(content);
            });
        }
        return wrapper;
    }

    function populateTextContent(element) {
        var content = buildTextContent(element.title, element.text);
        saveContentMetaDataId(content, element);
        return content;
    }

    function populateQuestionContent(element) {
        var content = buildQuestionContent(element.title, element.question, element.points_max);
        saveContentMetaDataId(content, element);
        return content;
    }

    function addAppletOnLoad(params, content) {
        params.appletOnLoad = function() {
            adjustContentToResize(content);
            window.GGBT_ws_header_footer.setWsScrollerHeight();
        };
    }

    function getGGBAppletFromId(id) {
        var container = getAppletContainerFromId(id);
        if (container.length) {
            if (container.hasClass("applet_container")) {
                var material_id = $(container).attr("id").substr(17);
            } else {
                var material_id = $(container).attr("data-material-id");
            }
            return window["applet_" + material_id];
        }
        return undefined;
    }
    function getAppletContainerFromId(id) {
        var applet = $('#'+id);
        if (applet.hasClass('applet_container')) {
            return applet;
        } else {
            var container = applet.parents('.applet_container');
            if (container.length === 0) {
                return applet.parents('.fullscreencontent, #fullscreencontent');
            } else {
                return container;
            }
        }
    }

    function handleAppletParameters(element) {
        var params,
            applet,
            id = "applet_" + element.clientId;
        if (element.parameters) {
            params = element.parameters;
        } else {
            params = {};
        }
        if (defaults.prerelease) {
            params.prerelease = true;
        }
        if (element.base64) {
            params.ggbBase64 = element.base64;
            applet = GGBApplet(id, params);
        } else if (element.sharing_key) {
            params.material_id = element.sharing_key;
            applet = GGBApplet(id, params);
        } else if (element.material_id) {
            params.material_id = element.material_id;
            applet = GGBApplet(id, params);
        }

        var previewUrl = (element.previewUrl === undefined) ? getDefaults().base_url+"/files/material-"+element.material_id+".png" : element.previewUrl;
        applet.setPreviewImage(previewUrl, getDefaults().base_url+"/images/GeoGebra_loading.png", getDefaults().base_url+"/images/applet_play.png");
        if (!params.preferredAppletType) {
            params.preferredAppletType = "auto";
        }
        return {params: params, applet: applet};
    }

    function populateAppletContent(element) {
        var content = buildAppletContent(element.title, null, false, (element.parameters ? element.parameters.exercise : undefined)),
            applet,
            params;
        var __ret = handleAppletParameters(element);
        params = __ret.params;
        applet = __ret.applet;
        //params.playButton = true;
        addAppletOnLoad(params, content.find(".content-added-content"));
        applet.inject(content.find(".content-added-content").get(0), params.preferredAppletType);
        saveContentMetaDataId(content, element);
        return content;
    }

    function populateExerciseContent(element) {
        var exercise = element.exercise.exercise,
            content = buildExerciseContent(element.title, exercise, false, element.points_max),
            ret = handleAppletParameters(element),
            applet = ret.applet,
            params = ret.params;
        //params.playButton = true;
        addAppletOnLoad(params, content.find(".content-added-content"));
        applet.inject(content.find(".applet-content").get(0), params.preferredAppletType);
        saveContentMetaDataId(content, element);
        return content;
    }

    function populateVideoContent(element) {
        var video = buildVideoFromLink(element.link),
            content = buildVideoContent(element.title, video);
        saveContentMetaDataId(content,  element);
        return content;
    }

    function populateImageContent(element) {
        var img = new Image(),
            content;
        img.src = element.link || element.base64;
        img.setAttribute('crossOrigin', 'anonymous');
        img.crossOrigin = "anonymous";
        content = buildImageContent(element.title, img, element.description);
        saveContentMetaDataId(content,  element);
        return content;
    }

    function buildPdfContentWrapper(href, name, isPopUp, thumbnail_url) {
        var wrapper = $("<div />", {
            class: "pdf-content"
            }),
            link = $("<a>", {
                data_href : href,
                text : name,
                class : "pdf_link",
                target: "_blank"
            }),
            thumbnail = '/images/default-thumbnails/small/default-pdf.png';
        if (isPopUp === "true") {
            wrapper.attr("data-popup", true);
        }
        if (thumbnail_url) {
            thumbnail = thumbnail_url;
        }
        link.append('<img src="' + thumbnail + '"/>');
        wrapper.append(link);
        return wrapper;
    }

    function populatePdfContent(element) {
        var link,
            content;
        link = buildPdfContentWrapper(element.link, element.parameters.name, "true", element.thumbnail_url).prop("outerHTML");
        content = buildPdfContent(element.title, link);
        saveContentMetaDataId(content, element);
        return content;
    }

    function populateWebContent(element) {
        var src = element.parameters.src,
            url = element.parameters.url,
            width = element.parameters.width,
            height = element.parameters.height,
            frame;

        if (element.parameters.popup === "true") {
            frame = $('<a/>').addClass('jModal')
                .data('src', src).data('url', url).data('width', width).data('height', height).data('popup', true);
            initWebElement(frame);
        } else {
            frame = $('<iframe/>').addClass('sFrame')
                .attr('src', src).attr('width', width + 'px').attr('height', height + 'px')
                .data('src', src).data('url', url).data('width', width).data('height', height).data('popup', false);
        }
        var content = buildWebContent(element.title, frame);
        saveContentMetaDataId(content, element);
        return content;
    }

    function saveContentMetaDataId(content, element) {
        if (element.id) {
            content.attr("data-content-meta_id", element.id);
        }
        populateElementInfoContent(element,  content);
    }

    function populateContent(element) {
        var content = null;
        switch (element.type) {
            case "text":
                content = populateTextContent(element);
                break;
            case "applet":
                content = populateAppletContent(element);
                break;
            case "video":
                content = populateVideoContent(element);
                break;
            case "image":
                content = populateImageContent(element);
                break;
            case "question":
                content = populateQuestionContent(element);
                break;
            case "exercise":
                content = populateExerciseContent(element);
                break;
            case "web":
                content = populateWebContent(element);
                break;
            case "pdf":
                content = populatePdfContent(element);
                break;
            default:
                console.log("unknown applet type");
        }
        if (window.GGBT_wsf_edit && element.comments) {
            content.attr("data-comment", JSON.stringify(element.comments));
        }
        return content;
    }

    function updatePageInfoContent() {
        if (data.info_worksheet !== null) {
            getWorksheet().data("wsf-info", JSON.stringify(data.info_worksheet)).attr("data-info", true);
        }
    }

    function updateElementInfoContent(element, content) {
        if (element.info_worksheet !== null) {
            content.data("wsf-info", JSON.stringify(element.info_worksheet)).attr("data-info", true);
        }
    }

    function updatePageCommentContent() {
        if (data.comments !== null || data.comments !== undefined) {
            getWorksheet().attr("data-comment", JSON.stringify(data.comments));
        }
    }

    function populatePageInfoContent() {
        updatePageInfoContent();
        updatePageCommentContent();
    }

    function populateElementInfoContent(element,  content) {
        updateElementInfoContent(element,  content);
    }

    function sortByOrder(elements) {
        elements.sort(function(a, b) {
            return a.order - b.order;
        });
    }

    function loadInfoContent(elements) {
        var i,
            l;
        if (elements && elements.length) {
            setWsfCurrentContent(wsfInfoContent);
            sortByOrder(elements);
            for (i = 0, l = elements.length; i < l; i++) {
                if (window.GGBT_wsf_edit !== undefined) {
                    saveContentClientId(populateContent(elements[i]), elements[i]);
                } else {
                    populateContent(elements[i]);
                }
            }
        }
    }

    function loadElementInfoContent() {
        var data_attr = getWsfActiveContent().data("wsf-info"),
            data_obj;
        if (data_attr) {
            if (typeof data_attr === "string") {
                data_obj = JSON.parse(data_attr);
            } else {
                data_obj = data_attr;
            }
        }
        clearInfoContent();
        if (data_obj && data_obj.elements) {
            loadInfoContent(data_obj.elements);
            getWsfActiveContent().data("wsf-info", JSON.stringify(data_obj));
        }
        setPageInfoState(false);
        wsfActiveInfo = getWsfActiveContent();
    }

    function closeInfoFromView() {
        getAllWorksheets().removeClass("info-shown");

        if (!getWsfInfo().hasClass("fullscreen")) {
            getWsfInfo().removeClass("shown");
        } else {
            getWsfInfo().hide(500, function() {
                getWsfInfo().removeClass("shown");
                getWsfInfo().show();
            });
        }
        getAllWorksheets().removeClass("fullscreen");
        getWsfInfo().removeClass("teacher-info");
        lastOpenedInfo = null;

        $(window).resize();

        if (typeof GGT_wsf_view !== undefined) {
            $(".wsf-element-info-button").removeClass("selected");
            $(".wsf-teacher-info-button").removeClass("selected");
        }
    }

    function toggleVideos(worksheet, playing) {
        if (worksheet.find(".youtube-player, .vimeo-player").length) {
            worksheet.find(".youtube-player, .vimeo-player").each(function(e) {
                if ($(this).get(0).contentWindow) {
                    if (!playing) {
                        if ($(this).hasClass("youtube-player")) {
                            $(this).get(0).contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
                        } else {
                            $(this).get(0).contentWindow.postMessage('{"method":"pause"}', '*');
                        }
                    }
                }/* else {
                    if ($(this).hasClass("youtube-player")) {
                        $(this).get(0).contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
                    } else {
                        $(this).get(0).contentWindow.postMessage('{"method":"play"}', '*');
                    }
                }*/
            });
        }
    }

    function onSwitchWorksheet(worksheet) {
        var oldWorksheet = getWorksheet();
        setWorksheet(worksheet);

        // If the info is open, load the info of the new worksheet
        if (oldWorksheet && oldWorksheet.length === 1 && oldWorksheet.hasClass("info-shown")) {
            oldWorksheet.removeClass("info-shown");
            initTeacherInfoPage($(".wsf-teacher-info-button"));
        }

        if (worksheet) {
            toggleVideos(worksheet, true);
        }

        if (oldWorksheet) {
            toggleVideos(oldWorksheet, false);
        }

        if (window.GGBT_ws_header_footer) {
            window.GGBT_ws_header_footer.onSwitchWorksheet(worksheet);
        }
    }

    function initTeacherInfoPage(button) {
        var currentlyClickedInfo,
            titleToShow;
        currentlyClickedInfo = button;

        titleToShow = $(".wsf-worksheet-title", getWorksheet()).val() ? $(".wsf-worksheet-title", getWorksheet()).val() : $(".wsf-worksheet-title", getWorksheet()).text();

        setInfoTitle(titleToShow);

        if(getLastOpenedInfo() === getInfoButtonID(currentlyClickedInfo)) {
            closeInfoFromView();
        } else {
            openInfoPage(currentlyClickedInfo);

            //$(".wsf-teacher-info-button").fadeOut("fast");
            //getButtonInfoClose().css({top: '19px'});
            getWsfInfo().addClass("teacher-info");
        }
    }

    function initElementInfoPage(button) {
        var currentlyClickedInfo = button,
            titleToShow = "",
            needToSave;

        if (getWsfActiveContent() !== null && getWsfActiveContent().has(".content-added-title")) {
            titleToShow = getWsfActiveContent().find(".content-added-title").text().trim();
        }

        setInfoTitle(titleToShow);

        //if(currentlyClickedInfo.get(0) === getLastOpenedInfo()) {
        if(getInfoButtonID(currentlyClickedInfo) === getLastOpenedInfo()) {
            closeInfoFromView();
            needToSave = true;
        } else {
            //getButtonInfoClose().css({top: (button.offset().top - $(".wsf-wrapper").offset().top - 7) + 'px'});
            //$(".wsf-teacher-info-button").fadeIn("fast");
            openInfoPage(currentlyClickedInfo);
            getWsfInfo().removeClass("teacher-info");
        }
        return needToSave;
    }

    function setPageInfoState(state) {
        pageInfoState  = state;
    }

    function isPageInfoState() {
        return pageInfoState;
    }

    function initWebElement(element) {
        var url = element.data('url'),
            box = $('<div/>').addClass('sPopup'),
            image = $('<img/>').addClass('thumbnail').attr('src', defaults.base_path + '/images/worksheet/web-placeholder.png'),
            details = $('<div/>').addClass('details')
                .append($('<div/>').addClass('title').text(defaults.url.link))
                .append($('<div/>').addClass('site').text(url))
                .append($('<div/>').addClass('host')),
            clear = $('<div/>').addClass('clear');
        // add default elements (overwritten if json call is successful)
        element.append(box.append(image).append(details).append(clear));

        $.ajax({
            dataType: "json",
            url: defaults.base_url + '/api/fetch-og.php',
            data: {url: url},
            success: function (data) {
                if (typeof data.og.image !== 'undefined') {
                    image.attr('src', data.og.image);
                }
                if (typeof data.og.site_name !== 'undefined') {
                    details.find('.site').text(data.og.site_name);
                }
                var title = data.title;
                if (typeof data.og.title !== 'undefined') {
                    title = data.og.title;
                }
                details.find('.title').text(title);
                if (element.data("title") === "") {
                    element.data("title", title);
                }
                details.find('.host').text(data.host);
            }
        });
    }

    function loadPageInfoContent() {
        var data_attr = getWorksheet().data("wsf-info"),
            data_obj;
        if (data_attr) {
            if (typeof data_attr === "string") {
                data_obj = JSON.parse(data_attr);
            } else {
                data_obj = data_attr;
            }
        }
        clearInfoContent();
        if (data_obj && data_obj.elements) {
            loadInfoContent(data_obj.elements);
            getWorksheet().data("wsf-info", JSON.stringify(data_obj));
        }
        setPageInfoState(true);
    }

    function clearInfoContent() {
        wsfInfoContent.empty();
    }

    function setWsfActiveContent(content) {
        wsfActiveContent = content;
    }

    function getWsfActiveContent() {
        return wsfActiveContent;
    }

    function getWsfCurrentContent() {
        return wsfCurrentContent;
    }

    function setData(d) {
        data = d;
    }

    function setDefaults(d) {
        defaults = d;
    }

    function getData() {
        return data;
    }

    function getDefaults() {
        return defaults;
    }

    var infoPageWidth = 830;
    var lastOpenedInfo = null;

    function openInfoPage(currentlyClickedInfo) {
        if ((currentlyClickedInfo.attr("class").search("wsf-teacher-info-button")) >= 0) {
            loadPageInfoContent();
        } else {
            loadElementInfoContent();
        }

        //if view mode hide currently clicked button
        /*if (typeof GGT_wsf_view !== undefined) {
            $(".wsf-element-info-button").fadeIn("fast");
            currentlyClickedInfo.fadeOut("fast");
        }*/
        if (typeof GGT_wsf_view !== undefined) {
            $(".wsf-teacher-info-button").removeClass("selected");
            $(".wsf-element-info-button").removeClass("selected");
            currentlyClickedInfo.addClass("selected");
        }

        //getButtonInfoClose().show();
        getWorksheet().addClass("info-shown");

        if (getWsfInfo().hasClass("fullscreen")) {
            getWsfInfo().hide();
            getWsfInfo().addClass("shown");
            getWsfInfo().show("fast", function() {
                scrollIntoViewIfNotInView(getWsfInfo());
            });
        } else {
            getWsfInfo().addClass("shown");
        }
        $(".wsf-info-scroller").scrollTop(0);

        //if(lastOpenedInfo === null) {
            //if($(window).width() >= 1706) {
            //    getWorksheet().animate({
            //        width: ($(window).width() - infoPageWidth) + "px"
            //    }, 1000);
            //}
        //}
        lastOpenedInfo = getInfoButtonID(currentlyClickedInfo);
        window.GGBT_parseLatexes();
        $(window).resize();
    }

    function getInfoButtonID(button) {
        var id = button.closest("li.wsf-content-added").data("content-client_id");
        if(id === undefined) {
            id = button.closest(".worksheet_element").attr("id");
        }
        if(id === undefined && (button.attr("class").search("wsf-teacher-info-button") >= 0)) {
            id = "wsf-teacher-info";
        }
        return id;
    }

    function getLastOpenedInfo() {
        return lastOpenedInfo;
    }

    function isElementInViewport (el) {
        var rect = el.getBoundingClientRect();

        return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /*or $(window).height() */
        rect.right <= (window.innerWidth || document.documentElement.clientWidth) /*or $(window).width() */
        );
    }

    function scrollIntoViewIfNotInView(el) {
        //special bonus for those using jQuery
        if (typeof jQuery === "function" && el instanceof jQuery) {
            el = el[0];
        }
        if (!isElementInViewport(el)) {
            el.scrollIntoView();
        }
    }

    function enableSaveButtons(enable) {
        var buttons = $('.jSave, .jSaveAndClose, .jClose, .jTurnIn');
        if (enable) {
            //buttons.removeAttr("disabled").removeClass('inactive').addClass('active');
            buttons.removeAttr("disabled").removeClass('inactive');
        } else {
            //buttons.attr("disabled", "disabled").removeClass('active').addClass('inactive');
            buttons.attr("disabled", "disabled").addClass('inactive');
        }
    }

    function getWsfActiveInfo() {
        return wsfActiveInfo;
    }

    function setWsfActiveInfo(info) {
        wsfActiveInfo = info;
    }

    function init() {
        getWorksheet();
        getWsfInfoContent();
        getWsfInfo();
        getButtonInfoClose();
        $(window).resize();
    }

    return {
        getWsfInfo : getWsfInfo,
        getWsfInfoContent: getWsfInfoContent,
        clearInfoContent : clearInfoContent,
        setPageInfoState: setPageInfoState,
        isPageInfoState: isPageInfoState,
        getWsfActiveContent: getWsfActiveContent,
        setWsfActiveContent: setWsfActiveContent,
        populateContent: populateContent,
        getWsfCurrentContent: getWsfCurrentContent,
        setWsfCurrentContent: setWsfCurrentContent,
        buildTextContent: buildTextContent,
        buildAppletContent: buildAppletContent,
        buildImageContent: buildImageContent,
        buildVideoContent: buildVideoContent,
        buildWebContent: buildWebContent,
        buildQuestionContent: buildQuestionContent,
        buildQuestionBody : buildQuestionBody,
        buildExerciseContent: buildExerciseContent,
        buildPdfContent: buildPdfContent,
        populatePageInfoContent: populatePageInfoContent,
        buildPdfContentWrapper : buildPdfContentWrapper,
        addEventsToPdfContent: addEventsToPdfContent,
        getData: getData,
        setData: setData,
        setDefaults: setDefaults,
        getDefaults: getDefaults,
        getButtonInfoClose: getButtonInfoClose,
        getWorkSheet: getWorksheet,
        setWorksheet: setWorksheet,
        openInfoPage: openInfoPage,
        closeInfoFromView: closeInfoFromView,
        setInfoTitle: setInfoTitle,
        initTeacherInfoPage: initTeacherInfoPage,
        initElementInfoPage: initElementInfoPage,
        initWebElement: initWebElement,
        getLastOpenedInfo: getLastOpenedInfo,
        getWsfActiveInfo: getWsfActiveInfo,
        setWsfActiveInfo: setWsfActiveInfo,
        saveContentClientId: saveContentClientId,
        generateClientId: generateClientId,
        init: init,
        onSwitchWorksheet : onSwitchWorksheet,
        adjustContentToResize: adjustContentToResize,
        adjustContentMaxWidth: adjustContentMaxWidth,
        getPage: getPage,
        getHeader: getHeader,
        getFeedbackHeader: getFeedbackHeader,
        getFooter: getFooter,
        buildVideoFromLink: buildVideoFromLink,
        getAllWorksheets: getAllWorksheets,
        getContainerWorksheet: getContainerWorksheet,
        getContainerPage: getContainerPage,
        getGGBAppletFromId: getGGBAppletFromId,
        getAppletContainerFromId: getAppletContainerFromId,
        enableSaveButtons: enableSaveButtons,
        addNewDataParamId: addNewDataParamId,

        CLASS_TEXT: CLASS_TEXT,
        CLASS_APPLET: CLASS_APPLET,
        CLASS_IMAGE: CLASS_IMAGE,
        CLASS_META: CLASS_META,
        CLASS_APPLET_EDIT: CLASS_APPLET_EDIT,
        CLASS_PDF: CLASS_PDF,
        CLASS_VIDEO: CLASS_VIDEO,
        CLASS_COMMENT: CLASS_COMMENT,
        CLASS_QUESTION: CLASS_QUESTION,
        CLASS_EXERCISE: CLASS_EXERCISE,
        CLASS_WEB: CLASS_WEB,
        ELEM_TYPE_Question: ELEM_TYPE_Question,
        ELEM_TYPE_Exercise: ELEM_TYPE_Exercise,
        ELEM_TYPE_GeoGebraApplet: ELEM_TYPE_GeoGebraApplet
    };
})(jQuery);

jQuery(document).ready(function() {
    "use strict";
    GGBT_wsf_general.init();
});