import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        // Ép trình duyệt cuộn thẳng lên đỉnh trang (x=0, y=0) ngay khi đổi URL
        window.scrollTo(0, 0);
    }, [pathname]);

    return null; // Component bổ trợ logic, không cần render giao diện
};

export default ScrollToTop;