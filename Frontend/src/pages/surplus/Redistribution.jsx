import React from "react";
import Layout from "../../components/layout/Layout";
import DistributionMap from "../../components/distribution/DistributionMap";

const Redistribution = () => {
  return (
    <Layout>
      <div className="h-[calc(100vh-6rem)] w-full relative">
        <DistributionMap />
      </div>
    </Layout>
  );
};

export default Redistribution;
