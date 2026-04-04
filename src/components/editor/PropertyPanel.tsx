'use client'

import { useEditorStore } from '@/store/editorStore'
import { TextPanel } from './panels/TextPanel'
import { StylePanel } from './panels/StylePanel'
import { ImagePanel } from './panels/ImagePanel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function PropertyPanel() {
  const selectedSection = useEditorStore((s) => s.getSelectedSection())

  if (!selectedSection) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm p-6 text-center gap-2">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-1">
          <span className="text-lg">👈</span>
        </div>
        <p className="font-medium text-gray-500">섹션을 선택하세요</p>
        <p className="text-xs text-gray-400">좌측 목록이나 미리보기를 클릭하면 편집할 수 있어요</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="px-4 py-3 border-b bg-gray-50/80 flex-shrink-0">
        <p className="text-sm font-semibold text-gray-800">{selectedSection.label}</p>
        <p className="text-xs text-gray-400 mt-0.5">섹션 편집</p>
      </div>

      {/* 탭 패널 */}
      <Tabs defaultValue="text" className="flex-1 overflow-hidden flex flex-col">
        <TabsList className="w-full rounded-none border-b h-9 bg-white flex-shrink-0">
          <TabsTrigger value="text"   className="flex-1 text-xs h-full rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500">텍스트</TabsTrigger>
          <TabsTrigger value="style"  className="flex-1 text-xs h-full rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500">스타일</TabsTrigger>
          <TabsTrigger value="image"  className="flex-1 text-xs h-full rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500">이미지</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="text"  className="m-0 p-4">
            <TextPanel  section={selectedSection} />
          </TabsContent>
          <TabsContent value="style" className="m-0 p-4">
            <StylePanel section={selectedSection} />
          </TabsContent>
          <TabsContent value="image" className="m-0 p-4">
            <ImagePanel section={selectedSection} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
