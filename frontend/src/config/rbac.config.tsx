"use client"
import { useEffect, useState, ReactNode } from "react";
import { useRouter } from 'next/navigation';
import { useSelector } from "react-redux";
import Swal from "sweetalert2";

interface CheckPermissionProps {
  allowedBy: string | string[];
  children: ReactNode;
}

const CheckPermission = ({ allowedBy, children }: CheckPermissionProps) => {
  const [isChecking, setIsChecking] = useState(true);

  //called loggedin user
  const loggedInUser = useSelector((root: any) => root.user.loggedInUser);
  const router = useRouter();

  // check permission
  useEffect(() => {
    const checkPermission = async () => {
      // If user is not logged in
      if (!loggedInUser) {
        Swal.fire({
          icon: "error",
          title: "Please login first",
          showConfirmButton: false,
          timer: 1500
        });
        setTimeout(() => {
          router.push("/login");
        }, 1500); // Give time for toast to show
        return;
      }

      // Check if loggedin user's role is within the allowed roles
      const hasAccess = Array.isArray(allowedBy)
        ? allowedBy.includes(loggedInUser.role)
        : loggedInUser.role === allowedBy;

      if (!hasAccess) {
        Swal.fire({
          icon: "error",
          title: "You don't have permission to access this panel!",
          showConfirmButton: false,
          timer: 1500
        });
        setTimeout(() => {
          router.push('/');
        }, 1500); // Give time for toast to show
        return;
      }

      // User has permission
      setIsChecking(false);
    };

    checkPermission();
  }, [loggedInUser, allowedBy, router]); // Reacts to changes in `loggedInUser`

  // Determine if the user has permission during synchronous render
  const isAllowed = loggedInUser && (Array.isArray(allowedBy)
    ? allowedBy.includes(loggedInUser.role)
    : loggedInUser.role === allowedBy);

  // If user has permission, render children
  if (isAllowed && !isChecking) {
    return <>{children}</>;
  }

  // Return null to prevent rendering unauthorized content
  return null;
};

export default CheckPermission;
