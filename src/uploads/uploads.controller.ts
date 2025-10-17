import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
  Req,
  ForbiddenException,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { PrismaService } from "../common/prisma.service";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

// ✅ Мини-описание типа файла, совместимое с multer 2.0.2
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

@Controller("api/uploads")
export class UploadsController {
  constructor(private prisma: PrismaService) {}

  @Post()
  @UseInterceptors(FilesInterceptor("files"))
  async upload(@UploadedFiles() files: MulterFile[], @Req() req: any) {
    if (!files?.length) throw new ForbiddenException("no_files");

    const uploadDir = path.join(process.cwd(), "uploads");
    await fs.promises.mkdir(uploadDir, { recursive: true });

    const out: any[] = [];

    for (const file of files) {
      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        throw new ForbiddenException(`disallowed_file_type: ${file.mimetype}`);
      }

      const cleanName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
      const unique = crypto.randomBytes(6).toString("hex");
      const ext = path.extname(cleanName);
      const basename = path.basename(cleanName, ext);
      const filename = `${basename}_${unique}${ext}`;
      const filepath = path.join(uploadDir, filename);

      await fs.promises.writeFile(filepath, file.buffer);

      const created = await this.prisma.attachment.create({
        data: {
          url: `/uploads/${filename}`,
          filename: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          uploadedById: req.userId,
        },
      });

      out.push(created);
    }

    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: req.userId,
          action: "upload",
          resource: "file",
          targetId: out[0]?.id ?? null,
          outcome: "allow",
        },
      });
    } catch {}

    return { files: out };
  }
}