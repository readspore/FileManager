1 - добавить в проект из area/admin MVC + wwwroot/file-manager-assets/*
2 - открыть файловый менеджер через js 
      pdFileManager.opentManager({
        multiple:true, 
        onCloseFunc: function(selectedFiles){
          console.log('selectedFiles', selectedFiles);
        }
      })
