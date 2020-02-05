using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using FileManager.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FileManager.Controllers
{
    public class FileController : Controller
    {
        readonly ApplicationContext db;
        readonly IWebHostEnvironment _appEnvironment;
        public const string UPLOAD_DIR_PATH = "Files";
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
            string path = "/" + UPLOAD_DIR_PATH + "/" + DateTime.Now.ToString("yyyy-MM");
            System.IO.Directory.CreateDirectory(_appEnvironment.WebRootPath + path);
            path += "/" + uploadedFile.FileName;

            // сохраняем файл в папку Files в каталоге wwwroot
            using (var fileStream = new FileStream(_appEnvironment.WebRootPath + path, FileMode.Create))
            {
                await uploadedFile.CopyToAsync(fileStream);
            }

            return new FileModel
            {
                Name = uploadedFile.FileName,
                Path = path,
                Creation = DateTime.Now.ToString("yyyyMMdd"),
                Format = new FileInfo(path).Extension
            };
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
            return Json(await db.Files.Skip((page - 1) * perPage).Take(perPage).ToListAsync());
        }

        public ActionResult GetUploadFilesForm()
        {
            return PartialView("_UploadFilesForm");
        }
    }
}