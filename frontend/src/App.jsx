import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import NlQuery from "./pages/NlQuery";
import ProductSearch from "./pages/ProductSearch";
import FinishedGoods from "./pages/FinishedGoods";
import ImageSearch from "./pages/ImageSearch";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="nl-query" element={<NlQuery />} />
          <Route path="search" element={<ProductSearch />} />
          <Route path="finished-goods" element={<FinishedGoods />} />
          <Route path="image-search" element={<ImageSearch />} />
          <Route path="*" element={<Dashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
