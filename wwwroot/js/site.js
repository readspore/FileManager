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

$('#uploadFileBtn').on('click', function (e) {
    return;
    e.preventDefault();
    window.ee = e;
    var files = document.getElementById('uploadFile').files;
    if (files.length > 0) {
        if (window.FormData !== undefined) {
            var data = new FormData(e.target.closest("form"));
            $.ajax({
                type: "POST",
                url: window.location.protocol + '//' + window.location.host + '/File/AddFile',
                contentType: false,
                processData: false,
                data: data,
                success: function (result) {
                    alert(result);
                },
                error: function (xhr, status, p3) {
                    alert(xhr.responseText);
                }
            });
        } else {
            alert("Браузер не поддерживает загрузку файлов HTML5!");
        }
    }
});

var pdFileManager = {
    canLoadMore: true,
    currentPage: 1, //start from 1
    perPage: 20,
    controllerURL: window.location.protocol + '//' + window.location.host + '/File',
    lastLoadedData: [],
    data: [],
    selectedData: [],
    openingManagerSetting: {
        multiple: true
    },
    events: {},
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
    opentManager: function (settings) {
        pdFileManager.openingManagerSetting = Object.assign(pdFileManager.openingManagerSetting, settings);
        if (!$('#pdFileManagerModal').length) pdFileManager.createFileManagerModule();
        document.body.dispatchEvent(pdFileManager.events['eBeforeOpen']);
        $('#pdFileManagerModal').modal();
        if (pdFileManager.canLoadMore) {
            pdFileManager.setFiles();
        };
        document.body.dispatchEvent(pdFileManager.events['eAfterOpen']);
    },
    closeManager: (e) => {
        console.log(e);
        e.preventDefault();
        document.body.dispatchEvent(pdFileManager.events['eBeforeClose']);
        $('#pdFileManagerModal').modal("hide");
        document.body.dispatchEvent(pdFileManager.events['eAfterClose']);
    },
    setFiles: function () {
        if (pdFileManager.data.length === 0)
            $('#pdFileManagerModal .modal-body').empty();
        var appendFilesToManager = () => {
            var i = 0;
            while (i < pdFileManager.perPage && pdFileManager.lastLoadedData.length > i) {
                var file = pdFileManager.lastLoadedData[i];
                let htmlStr = `                
                    <div class="img-wrap-1 hover-children-tile__fade-toggle" data-pd-image-id="${file.id}">
                        <div class="hover-tile__fade-toggle f-col" style="display: none;">
                            <a href="${pdFileManager.controllerURL}/Edit/${file.id}" target="_blank">Редактировать</a>
                            <a href="${pdFileManager.controllerURL}/Delete/${file.id}">Удалить</a>
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
                $('#pdFileManagerModal .modal-body').append(createElementFromHTML(htmlStr));
                $('#pdFileManagerModal .hover-children-tile__fade-toggle:last-child').hover((e) => onChildrenTileHover(e));
                ++i;
            };
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
            pdFileManager.selectedData.length = 0;
            $(`[data-pd-image-id] [data-pd-apply-selected]`).addClass('opacity-zero');
            let isCurrentChecked = $(`[data-pd-image-id="${fileId}"] [name="select-to-choose"]`).prop('checked');
            $(`[data-pd-image-id] [name="select-to-choose"]:checkbox`).prop('checked', false);
            $(`[data-pd-image-id="${fileId}"] [name="select-to-choose"]`).prop('checked', isCurrentChecked);
        }
        if ($(`[data-pd-image-id="${fileId}"] [name="select-to-choose"]`).prop('checked')) {
            pdFileManager.selectedData.push(pdFileManager.data.find(file => file.id == fileId));
            $(`[data-pd-image-id="${fileId}"] [data-pd-apply-selected]`).removeClass('opacity-zero');
        } else {
            pdFileManager.selectedData = pdFileManager.selectedData.filter(function (fileInfo) {
                return fileInfo.id !== fileId;
            });
            $(`[data-pd-image-id="${fileId}"] [data-pd-apply-selected]`).addClass('opacity-zero');
        }
    },
    createFileManagerModule: () => {
        $('body').append(createElementFromHTML(`
            <div class="modal fade" id="pdFileManagerModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLongTitle" aria-hidden="true">
              <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content">
                  <div class="modal-header">
                    <h5 class="modal-title" id="exampleModalLongTitle">Modal title</h5>
                    <button type="button" class="btn btn-secondary d-none" data-pd="choose">Выбрать</button>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                      <span aria-hidden="true">&times;</span>
                    </button>
                  </div>
                  <div class="modal-body">
                  </div>
                  <div class="modal-footer">
                    <div class="col text-center">
                      <button type="button" class="btn btn-primary text-center" id="pdFileManagerLoadMore" onclick="pdFileManager.loadMore()">Загрузить еще</button>
                      <button type="button" class="btn btn-secondary d-none" data-pd="choose">Выбрать</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>`)
        );
        pdFileManager.events['eBeforeOpen'] = new Event('eBeforeOpen');
        pdFileManager.events['eAfterOpen'] = new Event('eAfterOpen');
        pdFileManager.events['eBeforeClose'] = new Event('eBeforeClose');
        pdFileManager.events['eAfterClose'] = new Event('eAfterClose');
    }
    /*
     $('body:first').on('eAfterClose', ()=>{
    console.log(pdFileManager.selectedData)
    })
     */
};