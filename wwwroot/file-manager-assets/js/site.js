// Please see documentation at https://docs.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

// Write your JavaScript code.

/*----------------------helpers START-----------------*/

function createElementFromHTML(htmlString) {
    var div = document.createElement('div');
    div.innerHTML = htmlString.trim();

    // Change this to div.childNodes to support multiple top-level nodes
    return div.firstChild;
}
/*----------------------helpers END-----------------*/

document.addEventListener('DOMContentLoaded', () => {
    setTileHoverFade();
})

function setTileHoverFade() {
    $('.hover-children-tile__fade-toggle').hover((e) => onChildrenTileHover(e))
}

function onChildrenTileHover(e) {
    let tile = $(e.target).hasClass('hover-children-tile__fade-toggle')
        ? $(e.target).find('.hover-tile__fade-toggle')
        : $(e.target).closest('.hover-children-tile__fade-toggle').find('.hover-tile__fade-toggle');
    tile.fadeToggle();
}

var pdFileManager = {
    canLoadMore: true,
    currentPage: 1, //start from 1
    perPage: 20,
    controllerURL: window.location.protocol + '//' + window.location.host + '/Admin/File',
    lastLoadedData: [],
    data: [],
    selectedData: [],
    openingManagerSetting: {
        multiple: true,
        onCloseFunc : null
    },
    events: {},
    opentManager: function (settings) {
        pdFileManager.openingManagerSetting = Object.assign(pdFileManager.openingManagerSetting, settings);
        if (!$('#pdFileManagerModal').length) pdFileManager.createFileManagerModule();
        pdFileManager.resetAllSelections();
        document.body.dispatchEvent(pdFileManager.events['eBeforeOpen']);
        $('#pdFileManagerModal').modal();
        if (pdFileManager.canLoadMore) {
            pdFileManager.setFiles();
        };
        document.body.dispatchEvent(pdFileManager.events['eAfterOpen']);
    },
    closeManager: (e) => {
        e.preventDefault();
        if (!$(e.target).closest('.hover-tile__fade-toggle').find('[name="select-to-choose"]').prop('checked')) {
            return;
        }
        document.body.dispatchEvent(pdFileManager.events['eBeforeClose']);
        $('#pdFileManagerModal').modal("hide");
        document.body.dispatchEvent(pdFileManager.events['eAfterClose']);
        try {
            pdFileManager.openingManagerSetting.onCloseFunc(pdFileManager.selectedData);
        } catch (err) { }
    },
    setFiles: function () {
        if (pdFileManager.data.length === 0)
            $('#pdFileManagerModal #pd-all-files').empty();
        var appendFilesToManager = () => {
            var i = 0;
            while (i < pdFileManager.perPage && pdFileManager.lastLoadedData.length > i) {
                var file = pdFileManager.lastLoadedData[i];

                let htmlStr = `                
                    <div class="img-wrap-1 hover-children-tile__fade-toggle" data-pd-image-id="${file.id}">
                        <div class="hover-tile__fade-toggle f-col" style="display: none;">
                            <a href="" onclick="pdFileManager.editFileForm(event, ${file.id})">Редактировать</a>
                            <a href="" onclick="pdFileManager.deleteFile(event, ${file.id})">Удалить</a>
                            <label class="container-chb" >Выбрать
                              <input type="checkbox" name="select-to-choose" onchange="pdFileManager.selectFile(${file.id})">
                              <span class="checkmark"></span>
                            </label>
                            <a 
                                class="opacity-zero" 
                                onclick="pdFileManager.closeManager(event)" 
                                data-pd-apply-selected
                                href=""
                            >Применить</a>
                        </div>
                        <div class="img-wrap-2">
                            <img src="${file.path}">
                        </div>
                    </div>`;
                $('#pdFileManagerModal #pd-all-files').append(createElementFromHTML(htmlStr));
                $('#pdFileManagerModal .hover-children-tile__fade-toggle:last-child').hover((e) => onChildrenTileHover(e));
                ++i;
            };

            if (!$('[data-pd-image-id="fake"]').length) {
                for (var i = 0; i < 3; i++) {
                    $('#pdFileManagerModal #pd-all-files')
                        .append(
                            createElementFromHTML(
                                `<div class="img-wrap-1 hover-children-tile__fade-toggle" data-pd-image-id="fake"></div>`
                            )
                        );
                }
            }
        };
        let loadFilesData = new Promise((resolve, reject) => {
            pdFileManager.getFiles(pdFileManager.currentPage, pdFileManager.perPage, resolve);
        });
        loadFilesData.then(() => {
            appendFilesToManager();
        });
    },
    loadMore: () => {
        pdFileManager.setFiles();
    },
    selectFile: (fileId) => {
        if (!pdFileManager.openingManagerSetting.multiple) {
            pdFileManager.resetAllSelections(fileId);
        }
        if ($(`[data-pd-image-id="${fileId}"] [name="select-to-choose"]`).prop('checked')) {
            pdFileManager.selectedData.push(pdFileManager.data.find(file => file.id == fileId));
            $(`[data-pd-image-id="${fileId}"] [data-pd-apply-selected]`).removeClass('opacity-zero');
            $(`[data-pd-image-id="${fileId}"]`).addClass('active-choosen-file');
        } else {
            pdFileManager.selectedData = pdFileManager.selectedData.filter(function (fileInfo) {
                return fileInfo.id !== fileId;
            });
            $(`[data-pd-image-id="${fileId}"] [data-pd-apply-selected]`).addClass('opacity-zero');
            $(`[data-pd-image-id="${fileId}"]`).removeClass('active-choosen-file');
        }
    },
    resetAllSelections: (fileId = 0) => {
        pdFileManager.selectedData.length = 0;
        $(`[data-pd-image-id] [data-pd-apply-selected]`).addClass('opacity-zero');
        $(`[data-pd-image-id]`).removeClass('active-choosen-file');
        let isCurrentChecked = $(`[data-pd-image-id="${fileId}"] [name="select-to-choose"]`).prop('checked');
        $(`[data-pd-image-id] [name="select-to-choose"]:checkbox`).prop('checked', false);
        $(`[data-pd-image-id="${fileId}"] [name="select-to-choose"]`).prop('checked', isCurrentChecked);
    },
    editFileForm: (e, fileId) => {
        e.preventDefault();
        $('#fileManagerNav [href="#pd-edit"]').tab('show');
        $.ajax({
            type: "GET",
            url: pdFileManager.controllerURL + '/Edit/' + fileId,
            contentType: "application/json; charset=utf-8",
            dataType: "html",
            success: function (response) {
                $('#pd-edit').html(response);
            },
            failure: function (response) {
                alert(response.responseText);
            },
            error: function (response) {
                alert(response.responseText);
            }
        });
    },
    editFileData: (e, fileId) => {
        e.preventDefault();
        $.ajax({
            type: "POST",
            url: pdFileManager.controllerURL + '/Edit/' + fileId,
            data: {
                Id: fileId,
                Name: $("#Name").val()
            },
            success: function (response) {
                pdFileManager.addMsg("Успешно обновлено");
                //$('#pd-edit').html(response);
            },
            failure: function (response) {
                alert(response.responseText);
            },
            error: function (response) {
                alert(response.responseText);
            }
        });
    },
    deleteFile: (e, fileId) => {
        e.preventDefault();
        $.ajax({
            type: "GET",
            url: pdFileManager.controllerURL + '/Delete/' + fileId,
            contentType: "application/json; charset=utf-8",
            dataType: "html",
            beforeSend: (fileId) => {
                $(`[data-pd-image-id="${fileId}"]`).addClass('is-processing');
            },
            success: function (response) {
                $(`[data-pd-image-id="${fileId}"]`).addClass('d-none');
            }
        });
    },
    uploadFiles: (e) => {
        e.preventDefault();
        var files = document.getElementById('uploadFile').files;
        if (files.length > 0) {
            if (window.FormData !== undefined) {
                var data = new FormData(e.target.closest("form"));
                $.ajax({
                    type: "POST",
                    url: pdFileManager.controllerURL + '/AddFile',
                    contentType: false,
                    processData: false,
                    data: data,
                    success: function () {
                        pdFileManager.addMsg("Успешно загружено");
                        $("#uploadFile").val("");
                        document.querySelector("#uploadFile").files.length;
                        $('#pdFileManagerModal #pd-all-files').empty();
                        pdFileManager.canLoadMore = true;
                        $('#pdFileManagerLoadMore').css('display', 'block');
                        pdFileManager.data = [];
                        pdFileManager.currentPage = 1;
                        pdFileManager.loadMore();
                    },
                    error: function (xhr, status, p3) {
                        alert(xhr.responseText);
                    }
                });
            } else {
                alert("Браузер не поддерживает загрузку файлов HTML5!");
            }
        }
    },
    showUploadTab: () => {
        if (!$('#uploadFileBtn').length) {
            $.ajax({
                type: "GET",
                url: pdFileManager.controllerURL + '/GetUploadFilesForm',
                contentType: "application/json; charset=utf-8",
                dataType: "html",
                success: function (response) {
                    $('#pd-upload').html(response);
                },
                failure: function (response) {
                    alert(response.responseText);
                },
                error: function (response) {
                    alert(response.responseText);
                }
            });
        }
    },
    getFiles: (
        page = pdFileManager.currentPage,
        perPage = pdFileManager.perPage,
        resolve = false
    ) => {
        $.ajax({
            type: "POST",
            url: pdFileManager.controllerURL + '/ShowFileManager?'
                + 'page=' + page
                + '&perPage=' + perPage,
            success: function (result) {
                pdFileManager.lastLoadedData = result;
                pdFileManager.data = pdFileManager.data.concat(result);
                if (result.length < pdFileManager.perPage) {
                    $('#pdFileManagerLoadMore').css('display', 'none');
                    pdFileManager.canLoadMore = false;
                }
                if (resolve)
                    resolve();
                ++pdFileManager.currentPage;
            },
            error: function (xhr, status, p3) {
                alert('get Files error');
            }
        });
    },
    createFileManagerModule: () => {
        $('body').append(createElementFromHTML(`
            <div class="modal fade" id="pdFileManagerModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLongTitle" aria-hidden="true">
              <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content">
                  <div class="modal-header d-flex f-col">
                    <button type="button" class="btn btn-secondary d-none" data-pd="choose">Выбрать</button>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                      <span aria-hidden="true">&times;</span>
                    </button>
                    <ul class="nav nav-pills" id="fileManagerNav" role="tablist">
                      <li class="nav-item">
                        <a 
                            class="nav-link active" 
                            id="home-tab" 
                            data-toggle="pill" 
                            href="#pd-all-files-wrapper" 
                            role="tab" 
                            aria-controls="pd-all-files-wrapper" 
                            aria-selected="true"
                        >Все файлы</a>
                      </li>
                      <li class="nav-item">
                        <a 
                            class="nav-link" 
                            id="profile-tab" 
                            data-toggle="pill" 
                            href="#pd-upload" 
                            role="tab" 
                            aria-controls="pd-upload" 
                            aria-selected="false"
                            onclick="pdFileManager.showUploadTab()"
                        >Загрузить</a>
                      </li>
                      <li class="nav-item">
                        <a 
                            class="nav-link d-none" 
                            id="contact-tab" 
                            data-toggle="pill" 
                            href="#pd-edit" 
                            role="tab" 
                            aria-controls="pd-edit" 
                            aria-selected="false"
                        >Редактировать</a>
                      </li>
                    </ul>
                    <div id="pd-file-manager-notices"></div>
                  </div>
                  <div class="modal-body">
                    <div class="tab-content" id="fileManagerNavContent">
                      <div class="tab-pane fade show active f-col" role="tabpanel" aria-labelledby="pd-all-files-tab" id="pd-all-files-wrapper">
                          <div id="pd-all-files"></div>
                          <div class="modal-footer">
                            <div class="col text-center">
                              <button type="button" class="btn btn-primary text-center" id="pdFileManagerLoadMore" onclick="pdFileManager.loadMore()">Загрузить еще</button>
                              <button type="button" class="btn btn-secondary d-none" data-pd="choose">Выбрать</button>
                            </div>
                          </div>  
                      </div>
                      <div class="tab-pane fade" id="pd-upload" role="tabpanel" aria-labelledby="pd-upload-tab">Loading...</div>
                      <div class="tab-pane fade" id="pd-edit" role="tabpanel" aria-labelledby="pd-edit-tab">...</div>
                    </div>
                  </div>
                  <div class="modal-footer">
                  </div>
                </div>
              </div>
            </div>`)
        );
        pdFileManager.events['eBeforeOpen'] = new Event('eBeforeOpen');
        pdFileManager.events['eAfterOpen'] = new Event('eAfterOpen');
        pdFileManager.events['eBeforeClose'] = new Event('eBeforeClose');
        pdFileManager.events['eAfterClose'] = new Event('eAfterClose');
    /*
        $('body:first').on('eAfterClose', ()=>{});
    */
    },
    addMsg: (msgText, msgTitle = "Уведомление", msgTitleClass = '') => {
        let msgHTML = `
          <div class="toast" role="alert" aria-live="assertive" aria-atomic="true" data-delay="5000" data-pd-selectro-attr>
              <div class="toast-header">
                <strong class="mr-auto ${msgTitleClass}">${msgTitle}</strong>
                <button type="button" class="ml-2 mb-1 close" data-dismiss="toast" aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div class="toast-body">${msgText}</div>
            </div>`;
        $('#pdFileManagerModal #pd-file-manager-notices').append(createElementFromHTML(msgHTML));
        $('#pdFileManagerModal #pd-file-manager-notices [data-pd-selectro-attr]').last().toast('show')

    }
};