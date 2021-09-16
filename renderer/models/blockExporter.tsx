// @flow
import * as React from "react";
import PouchDB from "pouchdb";
import { SavedConfiguration } from "../component/remote_ssh/interface";
import { database_names } from "../../configurations/database_names";
import { ipcRenderer } from "electron";
import { WorkerCondition, WorkerStatus } from "worker-checking";
import { message } from "antd";

interface BlockExporter {
  setData(
    port: string,
    host: string,
    output: string,
    concurrency: number
  ): void;
  port: string;
  host: string;
  output: string;
  current: number;
  total: number;
  concurrency: number;
  isStarted: boolean;
  start(): void;
  stop(): void;
  currentBlock: any;
}

type Props = {
  children: any;
};

//@ts-ignore
export const BlockExporterContext = React.createContext<BlockExporter>({});

export function BlockExporterProvider({ children }: Props) {
  const [port, setPort] = React.useState("");
  const [host, setHost] = React.useState("");
  const [current, setCurrent] = React.useState(0);
  const [output, setOutput] = React.useState("");
  const [total, setTotal] = React.useState(0);
  const [isStarted, setIsStarted] = React.useState(false);
  const [currentBlock, setCurrentBlock] = React.useState();
  const [concurrency, setConcurrency] = React.useState(1);

  React.useEffect(() => {
    let host = localStorage.getItem("block_exporter_host");
    let port = localStorage.getItem("block_exporter_port");
    let output = localStorage.getItem("block_exporter_output");
    let concurrency = localStorage.getItem("block_exporter_concurrency");

    if (host) {
      setHost(host);
    }

    if (port) {
      setPort(port);
    }

    if (output) {
      setOutput(output);
    }

    if (concurrency) {
      setConcurrency(parseInt(concurrency));
    }

    ipcRenderer.on(
      "block-exporter-update",
      (e, { current, total, blockData }: any) => {
        setCurrent(current);
        setTotal(total);
        setCurrentBlock(blockData);
      }
    );

    ipcRenderer.on("block-exporter-status-changed", (e, started: any) => {
      setIsStarted(started);
    });

    ipcRenderer.on("block-exporter-error", async (e, msg) => {
      await message.error(msg.toString());
    });
  }, []);

  const start = React.useCallback(() => {
    ipcRenderer.send("block_exporter_start", {
      port,
      host,
      output,
      concurrency,
    });
  }, [host, port, output, concurrency]);

  const stop = React.useCallback(() => {
    ipcRenderer.send("block_exporter_stop");
  }, [host, port, output]);

  const setData = React.useCallback(
    (port: string, host: string, output: string, concurrency: number) => {
      setPort(port);
      setHost(host);
      setOutput(output);
      setConcurrency(concurrency);
      localStorage.setItem("block_exporter_host", host);
      localStorage.setItem("block_exporter_port", port);
      localStorage.setItem("block_exporter_output", output);
      localStorage.setItem(
        "block_exporter_concurrency",
        concurrency.toString()
      );
    },
    [host, port, concurrency, output]
  );

  const value: BlockExporter = {
    port,
    host,
    setData,
    total,
    current,
    output,
    start,
    stop,
    isStarted,
    currentBlock,
    concurrency,
  };

  return (
    <BlockExporterContext.Provider value={value}>
      {children}
    </BlockExporterContext.Provider>
  );
}
