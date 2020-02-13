using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using FileManager.Areas.Admin.Models;
using FileManager.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FileManager.Areas.Admin.Controllers
{
    //[Authorize(Roles = "admin")]
    public class FileController : Controller
    {
        readonly ApplicationContext db;
        readonly IWebHostEnvironment _appEnvironment;
        public const string UPLOAD_DIR_PATH = "Files";
        public readonly Dictionary<string, Size> additionalSizes = new Dictionary<string, Size>(){
            //{ "100",  new Size(150, 150) },
            //{ "200",  new Size(200, 200) },
            { "300",  new Size(300, 300) },
            { "400",  new Size(400, 400) },
            //{ "500",  new Size(500, 500) },
            //{ "600",  new Size(600, 600) },
            //{ "700",  new Size(700, 700) },
            //{ "800",  new Size(800, 800) }
            };
        public FileController(ApplicationContext context, IWebHostEnvironment appEnvironment)
        {
            db = context;
            _appEnvironment = appEnvironment;
        }

        [HttpPost]
        public async Task<IActionResult> AddFile(IFormFileCollection uploads)
        {
            using (db)
            {
                foreach (var uploadedFile in uploads)
                {
                    db.Files.Add(await SaveTheFile(uploadedFile));
                }
                db.SaveChanges();
            }
            return Redirect("/Home/Index");
        }

        private async Task<FileModel> SaveTheFile(IFormFile uploadedFile)
        {
            string path = "/" + UPLOAD_DIR_PATH + "/" + DateTime.Now.ToString("yyyy-MM") + "/";
            System.IO.Directory.CreateDirectory(_appEnvironment.WebRootPath + path);
            string uniqFileName = GetUniqNameInDir(path, uploadedFile.FileName);

            // сохраняем файл в папку Files в каталоге wwwroot
            using (var fileStream = new FileStream(_appEnvironment.WebRootPath + path + uniqFileName, FileMode.Create))
            {
                await uploadedFile.CopyToAsync(fileStream);
            }

            saveAdditionalSizes(_appEnvironment.WebRootPath + path, uniqFileName);

            return new FileModel
            {
                Name = uploadedFile.FileName,
                Path = path,
                Creation = DateTime.Now.ToString("yyyyMMdd"),
                Format = new FileInfo(path).Extension
            };
        }

        private void saveAdditionalSizes(string imagePath, string imgName)
        {
            if (additionalSizes.Count() == 0) 
                return;
            var originBm = new Bitmap(imagePath + imgName);
            foreach (var size in additionalSizes)
            {
                new Bitmap(originBm, size.Value)
                    .Save(
                        imagePath + 
                        AddFileNamePostfix(
                                imgName, "_"+size.Value.Height + "_" + size.Value.Width
                            )
                    );
            }
        }

        private string GetUniqNameInDir(string ditPath, string fileName)
        {
            bool nameNotUniq = true;
            int i = 0;
            var tmpName = fileName;
            while (nameNotUniq)
            {
                ++i;
                if (System.IO.File.Exists(_appEnvironment.WebRootPath + ditPath + "/" + tmpName))
                {
                    tmpName = AddFileNamePostfix(fileName, i.ToString());
                }
                else
                {
                    nameNotUniq = false;
                    fileName = tmpName;
                }
            }
            return fileName;
        }

        private string AddFileNamePostfix(string fileName, string postfix)
        {
            var tmpName = fileName;
            fileName = fileName.Replace(".", $"{postfix}.");
            return tmpName == fileName //if fileName not containsumbol . (extention)
                        ? fileName + postfix
                        : fileName;
        }

        [HttpGet]
        public async Task<IActionResult> Edit(int? id)
        {
            if (id != null)
            {
                FileModel file = await db.Files.FirstOrDefaultAsync(p => p.Id == id);
                if (file != null)
                    return PartialView("_EditFileForm", file);
            }
            return NotFound();
        }

        [HttpPost]
        public async Task<IActionResult> Edit(FileModel newFile)
        {
            if (!ModelState.IsValid)
                return BadRequest();
            var oldFile = db.Files.FirstOrDefault(f => f.Id == newFile.Id);
            oldFile.Name = newFile.Name;
            db.Files.Update(oldFile);
            await db.SaveChangesAsync();
            return Redirect("/Home/Index");
        }

        [HttpGet]
        public async Task<IActionResult> Delete(int? id)
        {
            if (id != null)
            {
                FileModel file = await db.Files.FirstOrDefaultAsync(p => p.Id == id);
                if (file != null)
                {
                    if (System.IO.File.Exists(_appEnvironment.WebRootPath + file.Path))
                    {
                        System.IO.File.Delete(_appEnvironment.WebRootPath + file.Path);
                    }
                    db.Files.Remove(file);
                    await db.SaveChangesAsync();
                    return Redirect("/Home/Index");
                }
            }
            return NotFound();
        }

        [HttpPost]
        public async Task<JsonResult> ShowFileManager(int page = 1, int perPage = 50)
        {
            return Json(await db.Files.OrderByDescending(f => f.Id).Skip((page - 1) * perPage).Take(perPage).ToListAsync());
        }

        public ActionResult GetUploadFilesForm()
        {
            return PartialView("_UploadFilesForm");
        }

        public ActionResult tt()
        {
            return Json(new { foo = "bar", method = "get" });
        }

        [HttpPost]
        public ActionResult tt(int? id = 0)
        {
            return Json(new { foo = "bar", method = "post" });
        }
    }
}