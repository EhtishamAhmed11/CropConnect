import { Container } from '@mui/material';
import Layout from "../../components/layout/Layout";
import DistributionMap from '../../components/distribution/DistributionMap';

const DistributionPage = () => {
    return (
        <Layout>
            <Container maxWidth="xl" className="h-[calc(100vh-100px)] p-0">
                {/* Full Screen Map Layout */}
                <div className="h-full w-full">
                    <DistributionMap />
                </div>
            </Container>
        </Layout>
    );
};

export default DistributionPage;
