'use client'

import { FC, useEffect, useState } from 'react'
import { useDraw } from '../hooks/useDraw'
import { ChromePicker } from 'react-color'
import { io } from 'socket.io-client'
import { drawLine } from '../utils/drawLine'
const socket = io('http://localhost:3001')

interface pageProps { }

type DrawLineProps = {
  prevPoint: Point | null
  currentPoint: Point
  color: string
}

const page: FC<pageProps> = ({ }) => {
  const [color, setColor] = useState<string>('#000')
  const { canvasRef, onMouseDown, clear } = useDraw(createLine)
  const [width, setWidth] = useState('400')

  useEffect(() => {
    console.log(window.innerWidth)
    if (window.innerWidth > 1024) {
      setWidth('600')
    } else if (window.innerWidth > 768) {
      setWidth('430')
    } else {
      setWidth('300')
    }
    console.log(width)
  }, [])

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')

    socket.emit('client-ready')

    socket.on('get-canvas-state', () => {
      if (!canvasRef.current?.toDataURL()) return
      console.log('sending canvas state')
      socket.emit('canvas-state', canvasRef.current.toDataURL())
    })

    socket.on('canvas-state-from-server', (state: string) => {
      console.log('I received the state')
      const img = new Image()
      img.src = state
      img.onload = () => {
        ctx?.drawImage(img, 0, 0)
      }
    })

    socket.on('draw-line', ({ prevPoint, currentPoint, color }: DrawLineProps) => {
      if (!ctx) return console.log('no ctx here')
      drawLine({ prevPoint, currentPoint, ctx, color })
    })

    socket.on('clear', clear)

    return () => {
      socket.off('draw-line')
      socket.off('get-canvas-state')
      socket.off('canvas-state-from-server')
      socket.off('clear')
    }
  }, [canvasRef])

  function createLine({ prevPoint, currentPoint, ctx }: Draw) {
    socket.emit('draw-line', { prevPoint, currentPoint, color })
    drawLine({ prevPoint, currentPoint, ctx, color })
  }

  return (
    <div className='flex flex-col sm:flex-row justify-center items-center w-screen h-screen bg-gray-100 gap-x-8 gap-y-4'>
      <div className='flex flex-col gap-y-4'>
        <ChromePicker color={color} onChange={(e) => setColor(e.hex)} />
        <button className='border border-black p-2 rounded-md bg-black text-white font-semibold tracking-wider' onClick={() => socket.emit('clear')}>Clear canvas</button>
      </div>
      <canvas ref={canvasRef} onMouseDown={onMouseDown} width={450} height={450} className={`w-[${width}px] h-[${width}px]` + 'border border-black  shadow-2xl bg-white'} />
    </div>
  )
}

export default page