import { listFloatingWidgets } from "@/lib/floating-widgets";
import { listUploadedImages } from "@/lib/uploads";
import { FloatingWidgetTable } from "./FloatingWidgetTable";

export const dynamic = "force-dynamic";

export default async function FloatingAdmin() {
  const [widgets, uploadedImages] = await Promise.all([listFloatingWidgets(), listUploadedImages()]);
  const imageOptions = uploadedImages.map((image) => ({ name: image.name, path: image.path }));

  return (
    <>
      <header className="admin-header">
        <div>
          <h1 className="display">浮窗</h1>
          <p>管理首页浮动入口，可同时启用多个文字或图片浮窗。</p>
        </div>
      </header>
      <FloatingWidgetTable initialWidgets={widgets} uploadedImages={imageOptions} />
    </>
  );
}
