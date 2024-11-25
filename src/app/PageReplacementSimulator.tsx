'use client'

import React, { useEffect, useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type SimulationStep = {
  reference: number;
  frames: number[];
  extraFrames: number[];
  pageFault: boolean;
};

type SimulationResult = {
  steps: SimulationStep[];
  totalFaults: number;
};

const PageReplacementSimulator = () => {
  const [referenceString, setReferenceString] = useState('6,1,2,3,1,4,1,5,3,4,1,4,3,2,3');
  const [frameCount, setFrameCount] = useState(3);
  const [extraFramesCount] = useState(0);
  const [algorithm, setAlgorithm] = useState('fifo');
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);

  useEffect(() => {
    setSimulation(null);
  }, [algorithm])

  const initializeFrames = (count: number) => Array(count).fill(-1);

  const simulateFIFO = (references: number[]) => {
    const frames = initializeFrames(frameCount);
    const extraFrames = initializeFrames(extraFramesCount);
    const steps: SimulationStep[] = [];
    let pageFaults = 0;
    let nextToReplace = 0;

    references.forEach((reference) => {
      let pageFault = false;

      if (![...frames, ...extraFrames].includes(reference)) {
        pageFault = true;
        pageFaults++;

        const emptyFrameIndex = frames.indexOf(-1);
        if (emptyFrameIndex !== -1) {
          frames[emptyFrameIndex] = reference;
        } else {
          const emptyExtraIndex = extraFrames.indexOf(-1);
          if (emptyExtraIndex !== -1) {
            extraFrames[emptyExtraIndex] = reference;
          } else {
            frames[nextToReplace] = reference;
            nextToReplace = (nextToReplace + 1) % frameCount;
          }
        }
      }

      steps.push({
        reference,
        frames: [...frames],
        extraFrames: [...extraFrames],
        pageFault,
      });
    });

    return { steps, totalFaults: pageFaults };
  };

  const simulateLRU = (references: number[]) => {
    const frames = initializeFrames(frameCount);
    const extraFrames = initializeFrames(extraFramesCount);
    const steps: SimulationStep[] = [];
    let pageFaults = 0;

    references.forEach((reference, currentIndex) => {
      let pageFault = false;

      if (![...frames, ...extraFrames].includes(reference)) {
        pageFault = true;
        pageFaults++;

        const emptyFrameIndex = frames.indexOf(-1);
        if (emptyFrameIndex !== -1) {
          frames[emptyFrameIndex] = reference;
        } else {
          const emptyExtraIndex = extraFrames.indexOf(-1);
          if (emptyExtraIndex !== -1) {
            extraFrames[emptyExtraIndex] = reference;
          } else {
            let leastRecentlyUsed = currentIndex;
            let replaceIndex = 0;

            frames.forEach((frame, index) => {
              const lastUse = references.lastIndexOf(frame, currentIndex - 1);
              if (lastUse < leastRecentlyUsed) {
                leastRecentlyUsed = lastUse;
                replaceIndex = index;
              }
            });

            frames[replaceIndex] = reference;
          }
        }
      }

      steps.push({
        reference,
        frames: [...frames],
        extraFrames: [...extraFrames],
        pageFault,
      });
    });

    return { steps, totalFaults: pageFaults };
  };

  const runSimulation = () => {
    const references = referenceString.split(',').map(Number);

    switch (algorithm) {
      case 'fifo':
        setSimulation(simulateFIFO(references));
        break;
      case 'lru':
        setSimulation(simulateLRU(references));
        break;
      default:
        break;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Simulador de Algoritmo de Substituição de Página</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Algorítimo</label>
            <Select value={algorithm} onValueChange={setAlgorithm}>
              <SelectTrigger>
                <SelectValue placeholder="Select algorithm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="fifo" value="fifo">FIFO</SelectItem>
                <SelectItem key="lru" value="lru">LRU</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">String de referência</label>
            <Input
              value={referenceString}
              onChange={(e) => setReferenceString(e.target.value)}
              placeholder="Ex: 1,2,3,4,1,2"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Número de frames</label>
            <Input
              type="number"
              value={frameCount}
              onChange={(e) => setFrameCount(parseInt(e.target.value))}
              min={1}
              max={10}
            />
          </div>

          <Button onClick={runSimulation}>Simular</Button>
        </CardContent>
      </Card>

      {simulation && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado da simulação</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription className='flex flex-row items-center gap-1'>
                <p className='uppercase font-semibold'>{`${algorithm} - `}</p>
                Total de falha(s) de página: {simulation.totalFaults}
              </AlertDescription>
            </Alert>
            <div className="mt-4 border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead className='text-center text-black font-semibold'>Ref.</TableHead>
                        {simulation.steps.map((step, i) => (
                            <TableHead key={`ref-${i}`} className="text-center">
                            {step.reference}
                            </TableHead>
                        ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array(frameCount).fill(0).map((_, frameIndex) => (
                        <TableRow key={`frame-${frameIndex}`}>
                            <TableCell className="font-semibold text-center">
                                F.{frameIndex + 1}
                            </TableCell>
                            {simulation.steps.map((step, stepIndex) => (
                                <TableCell key={`frame-${frameIndex}-${stepIndex}`} className="text-center">
                                    {step.frames[frameIndex] === -1 ? '-' : step.frames[frameIndex]}
                                </TableCell>
                            ))}
                        </TableRow>
                        ))}
                        <TableRow>
                        <TableCell className="font-semibold text-center">Falha de página</TableCell>
                        {simulation.steps.map((step, i) => (
                            <TableCell
                            key={`fault-${i}`}
                            className={`text-center ${
                                step.pageFault ? 'text-red-500 font-bold' : 'text-green-500'
                            }`}
                            >
                            {step.pageFault ? 'S' : '-'}
                            </TableCell>
                        ))}
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PageReplacementSimulator;
